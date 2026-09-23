'use client'

import { useEffect, useRef, useState } from 'react'
import { X, XCircle } from 'lucide-react'
import { formatDateShort } from '@/lib/slots'
import styles from './CancelAppointmentModal.module.css'

type Appointment = {
  id: string; studentName: string; studentGrade: string; parentName: string
  parentEmail: string; parentPhone: string; date: Date | string; startTime: string
  availability: { teacher: { name: string } }
}

export default function CancelAppointmentModal({ appointment, onClose, onCancelled }: {
  appointment: Appointment; onClose: () => void; onCancelled: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const submitting = useRef(false)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ notificationSent: boolean } | null>(null)

  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    dialog.current?.showModal()
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow; trigger?.focus() }
  }, [])

  function close() { if (!submitting.current) onClose() }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (submitting.current || result) return
    submitting.current = true; setSaving(true); setError('')
    try {
      const response = await fetch(`/api/agendamentos/${appointment.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', cancellationReason: reason.trim() || null }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(response.status === 401 ? 'Sua sessão expirou. Entre novamente.' : data?.error || 'Não foi possível cancelar. Tente novamente.')
      if (data?.status !== 'cancelled') throw new Error('Resposta inesperada. Atualize a lista para conferir o agendamento.')
      setResult({ notificationSent: data.notificationSent === true })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Falha na conexão. Atualize a lista antes de tentar novamente.')
    } finally { submitting.current = false; setSaving(false) }
  }

  // A atualização da lista não interfere no resultado do cancelamento já concluído.
  useEffect(() => { if (result) onCancelled() }, [result, onCancelled])

  return (
    <dialog ref={dialog} aria-labelledby="cancel-appointment-title" aria-describedby="cancel-appointment-description"
      className={styles.dialog} onCancel={event => { event.preventDefault(); close() }}
      onClick={event => {
        if (event.target !== dialog.current) return
        const rect = dialog.current!.getBoundingClientRect()
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close()
      }}>
      <header className={styles.header}>
        <div><span className={styles.eyebrow}>PLANTÃO PEDAGÓGICO</span><h2 id="cancel-appointment-title">{result ? 'Plantão cancelado' : 'Cancelar plantão'}</h2></div>
        <button type="button" onClick={close} disabled={saving} aria-label="Fechar" className={styles.close}><X size={20} /></button>
      </header>
      <div className={styles.body}>
        <p id="cancel-appointment-description">{result ? 'O cancelamento foi registrado no sistema.' : 'Confira o agendamento e, se desejar, explique o motivo ao responsável.'}</p>
        <dl className={styles.summary}>
          <div><dt>Aluno(a)</dt><dd>{appointment.studentName} · {appointment.studentGrade}</dd></div>
          <div><dt>Professor(a)</dt><dd>{appointment.availability.teacher.name}</dd></div>
          <div><dt>Data e horário</dt><dd>{formatDateShort(appointment.date)} às {appointment.startTime}</dd></div>
          <div><dt>Responsável</dt><dd>{appointment.parentName}</dd></div>
        </dl>
        {result ? <>
          <div role="status" className={result.notificationSent ? styles.success : styles.warning}>
            {result.notificationSent
              ? <>Aviso enviado por e-mail para <strong>{appointment.parentEmail}</strong>. O envio não confirma que o responsável leu a mensagem.</>
              : <>O plantão foi cancelado, mas <strong>não foi possível confirmar o envio do e-mail</strong>. Entre em contato com o responsável pelo telefone <strong>{appointment.parentPhone}</strong> para avisá-lo. E-mail cadastrado: {appointment.parentEmail}.</>}
          </div>
          {reason.trim() && <div className={styles.savedReason}><strong>Motivo registrado</strong><p>{reason.trim()}</p></div>}
          <div className={styles.actions}><button type="button" onClick={close} className={styles.secondary}>Concluir</button></div>
        </> : <form onSubmit={submit}>
          <label htmlFor="appointment-cancellation-reason" className={styles.label}>Motivo do cancelamento <span>(opcional)</span></label>
          <textarea id="appointment-cancellation-reason" value={reason} disabled={saving} onChange={event => setReason(event.target.value)}
            maxLength={500} rows={4} aria-describedby="cancellation-reason-help"
            placeholder="Ex.: A professora selecionada não atende a turma da sua filha. Por favor, faça um novo agendamento com a professora da turma." />
          <div className={styles.help}><span id="cancellation-reason-help">Se preenchido, este texto será incluído no e-mail enviado ao responsável.</span><span>{reason.length}/500</span></div>
          <p className={styles.recipient}>O aviso será enviado para <strong>{appointment.parentEmail}</strong>. Deixar o motivo vazio mantém o aviso padrão de cancelamento.</p>
          {error && <div role="alert" className={styles.error}>{error}</div>}
          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={close} disabled={saving}>Voltar</button>
            <button type="submit" className={styles.danger} disabled={saving}><XCircle size={17} />{saving ? 'Cancelando e enviando aviso…' : 'Confirmar cancelamento'}</button>
          </div>
        </form>}
      </div>
    </dialog>
  )
}

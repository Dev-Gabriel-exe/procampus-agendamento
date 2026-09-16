'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Ban, CalendarDays, CheckCircle, Loader2, Trash2, UserRound, Users, X, XCircle } from 'lucide-react'

type TeacherOption = {
  id: string
  name: string
}

type ScheduleBlockItem = {
  id: string
  startDate: string
  endDate: string
  reason: string
  canDelete: boolean
  teacher: { id: string; name: string } | null
}

function todayInput() {
  const local = new Date(Date.now() - 3 * 60 * 60 * 1000)
  return [
    local.getUTCFullYear(),
    String(local.getUTCMonth() + 1).padStart(2, '0'),
    String(local.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Fortaleza',
  })
}

function formatPeriod(block: ScheduleBlockItem) {
  const start = formatDate(block.startDate)
  const end = formatDate(block.endDate)
  return start === end ? start : `${start} a ${end}`
}

export default function ScheduleBlocksPanel({ onAppointmentsChanged }: { onAppointmentsChanged: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [blocks, setBlocks] = useState<ScheduleBlockItem[]>([])
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [startDate, setStartDate] = useState(todayInput())
  const [endDate, setEndDate] = useState(todayInput())
  const [scope, setScope] = useState<'all' | 'teacher'>('all')
  const [teacherId, setTeacherId] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [blocksResponse, teachersResponse] = await Promise.all([
        fetch('/api/bloqueios'),
        fetch('/api/professores'),
      ])
      const [blocksData, teachersData] = await Promise.all([
        blocksResponse.json(),
        teachersResponse.json(),
      ])
      if (!blocksResponse.ok || !teachersResponse.ok) throw new Error('Falha ao carregar os dados.')
      setBlocks(Array.isArray(blocksData) ? blocksData : [])
      setTeachers(Array.isArray(teachersData)
        ? teachersData.map((teacher: any) => ({ id: teacher.id, name: teacher.name }))
        : [])
    } catch {
      setMessage({ type: 'error', text: 'Não foi possível carregar os bloqueios.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving && !deletingId) setIsOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, saving, deletingId])

  const sortedTeachers = useMemo(
    () => [...teachers].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [teachers],
  )

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setMessage(null)

    if (!startDate || !endDate || !reason.trim()) {
      setMessage({ type: 'error', text: 'Preencha o período e o motivo.' })
      return
    }
    if (endDate < startDate) {
      setMessage({ type: 'error', text: 'A data final não pode ser anterior à inicial.' })
      return
    }
    if (scope === 'teacher' && !teacherId) {
      setMessage({ type: 'error', text: 'Selecione o professor.' })
      return
    }

    const target = scope === 'all'
      ? 'todos os professores'
      : sortedTeachers.find(teacher => teacher.id === teacherId)?.name ?? 'o professor selecionado'
    if (!window.confirm(`Bloquear ${formatDate(`${startDate}T12:00:00.000Z`)}${endDate !== startDate ? ` até ${formatDate(`${endDate}T12:00:00.000Z`)}` : ''} para ${target}? Agendamentos futuros existentes serão cancelados e os pais receberão um e-mail.`)) return

    setSaving(true)
    try {
      const response = await fetch('/api/bloqueios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate,
          endDate,
          teacherId: scope === 'teacher' ? teacherId : null,
          reason: reason.trim(),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Erro ao criar bloqueio.')

      const cancelledCount = Number(data.cancelledCount ?? 0)
      const notifiedCount = Number(data.notifiedCount ?? 0)
      setMessage({
        type: 'success',
        text: cancelledCount > 0
          ? notifiedCount === cancelledCount
            ? `Bloqueio criado. ${cancelledCount} agendamento${cancelledCount !== 1 ? 's' : ''} cancelado${cancelledCount !== 1 ? 's' : ''} e os pais foram notificados.`
            : `Bloqueio criado e ${cancelledCount} agendamento${cancelledCount !== 1 ? 's' : ''} cancelado${cancelledCount !== 1 ? 's' : ''}. Foram enviados ${notifiedCount} de ${cancelledCount} e-mails; confira a configuração do Gmail.`
          : 'Bloqueio criado. Não havia agendamentos futuros para cancelar.',
      })
      setReason('')
      setTeacherId('')
      setScope('all')
      await loadData()
      onAppointmentsChanged()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erro ao criar bloqueio.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(block: ScheduleBlockItem) {
    if (!block.canDelete) return
    if (!window.confirm('Desbloquear este período? Os agendamentos cancelados anteriormente não serão restaurados.')) return

    setDeletingId(block.id)
    setMessage(null)
    try {
      const response = await fetch(`/api/bloqueios?id=${encodeURIComponent(block.id)}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Erro ao desbloquear período.')
      setBlocks(current => current.filter(item => item.id !== block.id))
      setMessage({ type: 'success', text: 'Período desbloqueado. Os horários livres voltarão a aparecer para os pais.' })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erro ao desbloquear período.' })
    } finally {
      setDeletingId(null)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 10,
    border: '1.5px solid #d7eadb', background: 'white', color: '#0a1a0d',
    fontSize: 14, outline: 'none', fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', color: '#3d5c42', fontSize: 11, fontWeight: 800,
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMessage(null)
          setIsOpen(true)
        }}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: '1.5px solid rgba(234,88,12,0.28)', background: '#fff7ed', color: '#c2410c', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
      >
        <Ban style={{ width: 13, height: 13 }} />
        Bloquear datas
        {blocks.length > 0 && (
          <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, background: '#ea580c', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>
            {blocks.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="no-print"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget && !saving && !deletingId) setIsOpen(false)
          }}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(4,25,10,0.62)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
    <section role="dialog" aria-modal="true" aria-labelledby="schedule-blocks-title" style={{ width: 'min(920px,100%)', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', background: 'white', border: '1.5px solid rgba(245,158,11,0.25)', borderRadius: 18, padding: 18, boxShadow: '0 24px 70px rgba(0,0,0,0.28)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ban style={{ width: 20, height: 20, color: '#ea580c' }} />
          </div>
          <div>
            <h2 id="schedule-blocks-title" style={{ fontFamily: 'var(--font-display),"Roboto Slab",serif', color: '#0a1a0d', fontSize: 17, fontWeight: 800, margin: 0 }}>Bloquear agendamentos</h2>
            <p style={{ color: '#6b8f72', fontSize: 12, margin: '4px 0 0' }}>Cadastre datas ou semanas sem plantão. Não há limite de bloqueios.</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: '#fff7ed', color: '#c2410c', borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 700 }}>
            Agendamentos existentes serão cancelados
          </span>
          <button type="button" onClick={() => setIsOpen(false)} disabled={saving || Boolean(deletingId)} aria-label="Fechar" title="Fechar" style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid #e5e7eb', background: 'white', color: '#64748b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: saving || deletingId ? 'not-allowed' : 'pointer' }}>
            <X style={{ width: 17, height: 17 }} />
          </button>
        </div>
      </div>

      <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }} className="block-form-grid">
        <div>
          <label style={labelStyle}>Data inicial</label>
          <input type="date" value={startDate} onChange={event => {
            setStartDate(event.target.value)
            if (!endDate || endDate < event.target.value) setEndDate(event.target.value)
          }} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Data final</label>
          <input type="date" min={startDate || undefined} value={endDate} onChange={event => setEndDate(event.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Quem será bloqueado</label>
          <select value={scope} onChange={event => {
            const nextScope = event.target.value as 'all' | 'teacher'
            setScope(nextScope)
            if (nextScope === 'all') setTeacherId('')
          }} style={inputStyle}>
            <option value="all">Todos os professores</option>
            <option value="teacher">Um professor específico</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Professor</label>
          <select value={teacherId} disabled={scope !== 'teacher'} onChange={event => setTeacherId(event.target.value)} style={{ ...inputStyle, opacity: scope === 'teacher' ? 1 : 0.55 }}>
            <option value="">{scope === 'teacher' ? 'Selecione o professor' : 'Não se aplica'}</option>
            {sortedTeachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Motivo exibido aos pais</label>
          <textarea maxLength={240} rows={2} value={reason} onChange={event => setReason(event.target.value)} placeholder="Ex.: Semana de provas ou afastamento médico do professor." style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }} />
          <p style={{ textAlign: 'right', color: '#9ca3af', fontSize: 10, margin: '3px 2px 0' }}>{reason.length}/240</p>
        </div>
        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minWidth: 210, padding: '11px 18px', borderRadius: 11, border: 'none', background: saving ? '#fdba74' : 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white', fontWeight: 800, fontSize: 13, cursor: saving ? 'wait' : 'pointer' }}>
            {saving ? <Loader2 style={{ width: 16, height: 16, animation: 'spin .8s linear infinite' }} /> : <Ban style={{ width: 16, height: 16 }} />}
            {saving ? 'Aplicando bloqueio...' : 'Bloquear data ou período'}
          </button>
        </div>
      </form>

      {message && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 14, padding: '10px 12px', borderRadius: 10, background: message.type === 'success' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`, color: message.type === 'success' ? '#15803d' : '#b91c1c', fontSize: 12, fontWeight: 600 }}>
          {message.type === 'success' ? <CheckCircle style={{ width: 15, height: 15, flexShrink: 0 }} /> : <XCircle style={{ width: 15, height: 15, flexShrink: 0 }} />}
          {message.text}
        </div>
      )}

      <div style={{ borderTop: '1px solid #eef5ef', marginTop: 16, paddingTop: 14 }}>
        <p style={{ color: '#3d5c42', fontSize: 12, fontWeight: 800, margin: '0 0 10px' }}>Bloqueios atuais ({blocks.length})</p>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b8f72', fontSize: 12, padding: 8 }}><Loader2 style={{ width: 15, height: 15, animation: 'spin .8s linear infinite' }} />Carregando...</div>
        ) : blocks.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: 12, padding: '8px 0', margin: 0 }}>Nenhuma data futura está bloqueada.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 9 }}>
            {blocks.map(block => (
              <article key={block.id} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {block.teacher ? <UserRound style={{ width: 15, height: 15, color: '#d97706' }} /> : <Users style={{ width: 15, height: 15, color: '#d97706' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#92400e', fontSize: 12, fontWeight: 800, margin: 0 }}><CalendarDays style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />{formatPeriod(block)}</p>
                  <p style={{ color: '#78350f', fontSize: 11, fontWeight: 700, margin: '3px 0 0' }}>{block.teacher ? `Prof. ${block.teacher.name}` : 'Todos os professores'}</p>
                  <p style={{ color: '#92400e', fontSize: 11, lineHeight: 1.4, margin: '5px 0 0', overflowWrap: 'anywhere' }}>{block.reason}</p>
                </div>
                <button type="button" onClick={() => handleDelete(block)} disabled={!block.canDelete || deletingId === block.id} title={block.canDelete ? 'Desbloquear período' : 'Criado por outra coordenação'} style={{ border: 'none', background: 'transparent', color: block.canDelete ? '#dc2626' : '#cbd5e1', cursor: block.canDelete ? 'pointer' : 'not-allowed', padding: 4, display: 'flex' }}>
                  {deletingId === block.id ? <Loader2 style={{ width: 15, height: 15, animation: 'spin .8s linear infinite' }} /> : <Trash2 style={{ width: 15, height: 15 }} />}
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      <style>{`@media(max-width:640px){.block-form-grid{grid-template-columns:1fr!important;}.block-form-grid>div{grid-column:1!important;}}`}</style>
    </section>
        </div>
      )}
    </>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Ban, CalendarDays, CheckCircle, Loader2, Search, Trash2, X } from 'lucide-react'
import styles from './ScheduleBlocksPanel.module.css'

type TeacherOption = { id: string; name: string; grades: string[] }
type Block = {
  id: string; startDate: string; endDate: string; reason: string; grades: string[]
  canDelete: boolean; teacher: { id: string; name: string } | null
}
function today() { return new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 10) }
function displayDate(value: string) { return new Date(value.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('pt-BR', { timeZone: 'America/Fortaleza' }) }
function errorText(error: unknown) { return error instanceof Error ? error.message : 'Falha inesperada. Tente novamente.' }
async function readResponse(response: Response) {
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(response.status === 401 ? 'Sua sessão expirou. Entre novamente.' : data?.error || 'Não foi possível carregar os dados. Tente novamente.')
  if (!data) throw new Error('O servidor retornou uma resposta inválida. Atualize a página.')
  return data
}

export default function ScheduleBlocksPanel({ onAppointmentsChanged }: { onAppointmentsChanged: () => void }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'new' | 'list'>('new')
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [grades, setGrades] = useState<string[]>([])
  const [blocks, setBlocks] = useState<Block[]>([])
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [blocksLoading, setBlocksLoading] = useState(true)
  const [optionsReady, setOptionsReady] = useState(false)
  const [optionsError, setOptionsError] = useState('')
  const [blocksError, setBlocksError] = useState('')
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null)
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [allTeachers, setAllTeachers] = useState(true)
  const [teacherIds, setTeacherIds] = useState<string[]>([])
  const [allGrades, setAllGrades] = useState(false)
  const [selectedGrades, setSelectedGrades] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [reason, setReason] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const busy = saving || Boolean(deletingId)
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const submitting = useRef(false)

  const loadBlocks = useCallback(async () => {
    setBlocksLoading(true); setBlocksError('')
    try {
      const data = await readResponse(await fetch('/api/bloqueios', { cache: 'no-store' }))
      if (!Array.isArray(data)) throw new Error('Resposta inválida ao carregar os bloqueios.')
      setBlocks(data.map(block => ({ ...block, grades: Array.isArray(block.grades) ? block.grades : [] })))
    } catch (error) { setBlocksError(errorText(error)) }
    finally { setBlocksLoading(false) }
  }, [])

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true); setOptionsError(''); setOptionsReady(false)
    try {
      const response = await fetch('/api/bloqueios/opcoes', { cache: 'no-store' })
      const data = await response.json().catch(() => null)
      if (Array.isArray(data?.grades)) setGrades(data.grades)
      if (!response.ok) throw new Error(response.status === 401 ? 'Sua sessão expirou. Entre novamente.' : data?.error || 'Não foi possível carregar as opções. Tente novamente.')
      if (!Array.isArray(data?.teachers) || !Array.isArray(data?.grades)) throw new Error('As opções de bloqueio não estão atualizadas no servidor.')
      setTeachers(data.teachers); setOptionsReady(true)
    } catch (error) { setOptionsError(errorText(error)) }
    finally { setOptionsLoading(false) }
  }, [])

  useEffect(() => { void loadBlocks() }, [loadBlocks])
  useEffect(() => {
    if (!open) return
    dialog.current?.showModal()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous; trigger.current?.focus() }
  }, [open])

  function openDialog() {
    setOpen(true); setReviewing(false); setMessage(null)
    void loadOptions(); void loadBlocks()
  }
  function closeDialog() { if (!busy) setOpen(false) }
  const chosenNames = teachers.filter(teacher => teacherIds.includes(teacher.id)).map(teacher => teacher.name)
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const visibleTeachers = teachers.filter(teacher => normalize(teacher.name).includes(normalize(search)))
  const gradeSummary = allGrades ? 'Todas as séries' : selectedGrades.join(', ') || 'Nenhuma série selecionada'
  const teacherSummary = allTeachers ? 'Todos os professores do seu acesso' : chosenNames.join(', ') || 'Nenhum professor selecionado'
  const canSubmit = optionsReady && !optionsLoading && !blocksLoading && !blocksError && !busy
  const selectionValid = (allTeachers || teacherIds.length > 0) && (allGrades || selectedGrades.length > 0)

  function toggleGrade(grade: string) {
    setSelectedGrades(current => {
      const base = allGrades ? grades : current
      return base.includes(grade) ? base.filter(item => item !== grade) : [...base, grade]
    })
    setAllGrades(false)
  }
  function toggleTeacher(id: string) {
    setTeacherIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
  }
  function review(event: React.FormEvent) {
    event.preventDefault(); setMessage(null)
    if (!canSubmit) return
    if (!selectionValid) { setMessage({ error: true, text: 'Marque pelo menos uma série e um professor, ou escolha todas/todos.' }); return }
    if (!startDate || !endDate || endDate < startDate || endDate < today()) { setMessage({ error: true, text: 'Confira as datas: o período não pode terminar antes de começar nem estar totalmente no passado.' }); return }
    if (reason.trim().length < 3 || reason.trim().length > 240) { setMessage({ error: true, text: 'Informe um motivo de 3 a 240 caracteres.' }); return }
    setReviewing(true)
  }
  async function save() {
    if (submitting.current || !canSubmit || !selectionValid) return
    submitting.current = true; setSaving(true); setMessage(null)
    try {
      const data = await readResponse(await fetch('/api/bloqueios', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, teacherScope: allTeachers ? 'all' : 'selected', teacherIds: allTeachers ? [] : teacherIds, gradeScope: allGrades ? 'all' : 'selected', grades: allGrades ? [] : selectedGrades, reason: reason.trim() }),
      }))
      const cancelled = Number(data.cancelledCount ?? 0)
      const notified = Number(data.notifiedCount ?? 0)
      setMessage({ error: false, text: 'Bloqueio salvo. ' + (cancelled ? cancelled + ' agendamento(s) cancelado(s); ' + notified + ' de ' + cancelled + ' e-mails enviados.' + (notified < cancelled ? ' Confira o serviço de e-mail.' : '') : 'Nenhum agendamento precisou ser cancelado.') })
      setReviewing(false); setReason(''); setTab('list')
      void loadBlocks()
      onAppointmentsChanged()
    } catch (error) { setMessage({ error: true, text: errorText(error) }) }
    finally { setSaving(false); submitting.current = false }
  }
  async function remove(block: Block) {
    if (busy || !block.canDelete || !window.confirm('Remover o bloqueio de ' + (block.teacher?.name ?? 'todos os professores') + ', de ' + displayDate(block.startDate) + ' a ' + displayDate(block.endDate) + '? Outros bloqueios continuam valendo. Agendamentos cancelados não serão restaurados.')) return
    setDeletingId(block.id); setMessage(null)
    try {
      await readResponse(await fetch('/api/bloqueios?id=' + encodeURIComponent(block.id), { method: 'DELETE' }))
      setBlocks(current => current.filter(item => item.id !== block.id))
      setMessage({ error: false, text: 'Bloqueio removido. Outros bloqueios do mesmo período continuam valendo.' })
    } catch (error) { setMessage({ error: true, text: errorText(error) }) }
    finally { setDeletingId(null) }
  }

  return <>
    <button ref={trigger} type="button" className={styles.trigger + ' no-print'} onClick={openDialog}><Ban size={14} /> Bloquear datas {blocks.length > 0 && <span>{blocks.length}</span>}</button>
    {open && <dialog ref={dialog} className={styles.dialog + ' no-print'} aria-labelledby="blocks-title" onCancel={event => { event.preventDefault(); closeDialog() }} onClick={event => {
      if (event.target !== event.currentTarget) return
      const rect = event.currentTarget.getBoundingClientRect()
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog()
    }}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>CALENDÁRIO DE PLANTÕES</p><h2 id="blocks-title">Bloquear agendamentos</h2><p>Escolha quando, quais séries e quais professores.</p></div>
        <button className={styles.close} type="button" aria-label="Fechar bloqueios" disabled={busy} onClick={closeDialog}><X size={20} /></button>
      </header>
      <nav className={styles.tabs} aria-label="Gerenciar bloqueios">
        <button type="button" aria-pressed={tab === 'new'} disabled={busy} onClick={() => { setTab('new'); setReviewing(false) }}>Novo bloqueio</button>
        <button type="button" aria-pressed={tab === 'list'} disabled={busy} onClick={() => { setTab('list'); setReviewing(false) }}>Bloqueios cadastrados ({blocks.length})</button>
      </nav>
      <div className={styles.body}>
        {message && <div role={message.error ? 'alert' : 'status'} className={message.error ? styles.error : styles.success}>{!message.error && <CheckCircle size={18} />}{message.text}</div>}
        {blocksError && <div role="alert" className={styles.error}>{blocksError}<button type="button" onClick={() => void loadBlocks()}>Tentar carregar bloqueios novamente</button></div>}
        {tab === 'list' ? <>
          <p className={styles.note}>Bloqueios se acumulam. Um bloqueio antigo para todas as séries também impede o 1º ano: remova-o se a intenção mudou. Cada professor selecionado tem um registro, para permitir desbloqueá-lo separadamente.</p>
          {blocksLoading ? <p role="status">Carregando bloqueios…</p> : !blocksError && !blocks.length ? <p className={styles.empty}>Nenhum bloqueio atual ou futuro cadastrado.</p> : null}
          <div className={styles.blockList}>{blocks.map(block => <article key={block.id} className={styles.block}>
            <div><strong><CalendarDays size={15} /> {displayDate(block.startDate)}{block.startDate !== block.endDate && ' a ' + displayDate(block.endDate)}</strong>
              <p>{block.teacher?.name ?? 'Todos os professores do grupo'}</p><p className={styles.note}>{block.grades.length ? block.grades.join(' · ') : 'Todas as séries'}</p><p>{block.reason}</p></div>
            <button type="button" className={styles.remove} disabled={busy || !block.canDelete} onClick={() => void remove(block)} aria-label={'Desbloquear ' + (block.teacher?.name ?? 'todos os professores')} title={block.canDelete ? 'Desbloquear' : 'Criado por outra coordenação'}><Trash2 size={16} /> Desbloquear</button>
          </article>)}</div>
        </> : <>
          {optionsError && <div role="alert" className={styles.error}>{optionsError}<button type="button" onClick={() => void loadOptions()}>Tentar carregar opções novamente</button></div>}
          {optionsLoading && <p role="status" className={styles.loading}><Loader2 size={17} /> Carregando professores e séries…</p>}
          {reviewing ? <section className={styles.review} aria-label="Revisar bloqueio">
            <h3>Confira antes de confirmar</h3><dl><dt>Período</dt><dd>{displayDate(startDate)} a {displayDate(endDate)}</dd><dt>Séries</dt><dd>{gradeSummary}</dd><dt>Professores</dt><dd>{teacherSummary}</dd><dt>Motivo exibido aos pais</dt><dd>{reason.trim()}</dd></dl>
            <p className={styles.warning}>Somente os agendamentos futuros que coincidirem com o período, os professores e as séries acima serão cancelados. O sistema tentará avisar os responsáveis por e-mail. Os cancelamentos não são desfeitos ao remover o bloqueio.</p>
            <div className={styles.actions}><button type="button" disabled={busy} onClick={() => setReviewing(false)}>Voltar e ajustar</button><button type="button" className={styles.primary} disabled={!canSubmit} onClick={() => void save()}>{saving ? 'Salvando…' : 'Confirmar bloqueio'}</button></div>
          </section> : <form onSubmit={review}>
            <fieldset disabled={busy}><legend>1. Quando bloquear?</legend><div className={styles.dateGrid}>
              <label>Data inicial<input required type="date" value={startDate} onChange={event => { setStartDate(event.target.value); if (endDate < event.target.value) setEndDate(event.target.value) }} /></label>
              <label>Data final<input required type="date" min={startDate} value={endDate} onChange={event => setEndDate(event.target.value)} /></label>
            </div><p className={styles.note}>Para um único dia, use a mesma data nos dois campos.</p></fieldset>
            <fieldset disabled={busy || optionsLoading || !grades.length}><legend>2. Quais séries serão bloqueadas?</legend>
              <label className={styles.master}><input type="checkbox" checked={allGrades} onChange={event => { setAllGrades(event.target.checked); setSelectedGrades([]) }} /> Todas as séries do meu acesso</label>
              <p className={styles.note}>Marque uma ou mais séries. Isso funciona também com todos os professores.</p>
              <div className={styles.gradeGrid}>{grades.map(grade => <label key={grade} className={styles.option} data-checked={allGrades || selectedGrades.includes(grade)}><input type="checkbox" checked={allGrades || selectedGrades.includes(grade)} onChange={() => toggleGrade(grade)} />{grade}</label>)}</div>
              <p className={styles.count}>{allGrades ? 'Todas as séries' : selectedGrades.length + ' série(s) selecionada(s)'}</p>
            </fieldset>
            <fieldset disabled={busy || !optionsReady || optionsLoading}><legend>3. Quais professores?</legend>
              <div className={styles.scope}><label><input type="radio" name="block-teacher-scope" checked={allTeachers} onChange={() => setAllTeachers(true)} /> Todos os professores</label><label><input type="radio" name="block-teacher-scope" checked={!allTeachers} onChange={() => setAllTeachers(false)} /> Selecionar professores</label></div>
              {allTeachers ? <p className={styles.note}>Vale para todos os professores do seu acesso, somente nas séries marcadas acima.</p> : <>
                <label className={styles.search}><Search size={17} /><input type="search" aria-label="Buscar professor" placeholder="Buscar pelo nome…" value={search} onChange={event => setSearch(event.target.value)} /></label>
                <div className={styles.tools}><span>{teacherIds.length} professor(es) selecionado(s)</span><button type="button" onClick={() => setTeacherIds(current => [...new Set([...current, ...visibleTeachers.map(teacher => teacher.id)])])}>Marcar exibidos</button><button type="button" onClick={() => setTeacherIds([])}>Limpar professores</button></div>
                <div className={styles.teacherList}>{visibleTeachers.map(teacher => <label key={teacher.id} className={styles.option} data-checked={teacherIds.includes(teacher.id)}><input type="checkbox" checked={teacherIds.includes(teacher.id)} onChange={() => toggleTeacher(teacher.id)} /><span>{teacher.name}<small>{teacher.grades.join(' · ') || 'Sem vínculo de série cadastrado'}</small></span></label>)}</div>
                {!visibleTeachers.length && <p className={styles.empty}>{teachers.length ? 'Nenhum professor corresponde à busca.' : 'Nenhum professor cadastrado para este acesso. Confira o cadastro na aba Professores.'}</p>}
              </>}
            </fieldset>
            <fieldset disabled={busy}><legend>4. Motivo para os responsáveis</legend><label><span className={styles.note}>Ex.: Semana de provas do 2º ao 5º ano.</span><textarea aria-label="Motivo exibido aos pais" required minLength={3} maxLength={240} rows={2} value={reason} onChange={event => setReason(event.target.value)} /></label><p className={styles.count}>{reason.length}/240</p></fieldset>
            <div className={styles.summary}><strong>Resumo do bloqueio</strong><p>{gradeSummary}</p><p>{teacherSummary}</p><small>Os demais atendimentos não são afetados por este bloqueio.</small></div>
            <div className={styles.actions}><button type="button" onClick={closeDialog} disabled={busy}>Fechar</button><button className={styles.primary} type="submit" disabled={!canSubmit || !selectionValid}>Revisar bloqueio</button></div>
          </form>}
        </>}
      </div>
    </dialog>}
  </>
}

// app/secretaria/recuperacao/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast, Toaster } from 'sonner'
import Link from 'next/link'
import {
  CalendarDays, Users, LogOut, BookOpen, ClipboardList,
  Plus, Trash2, ChevronDown, AlertCircle, X, Users2,
  CheckCircle, XCircle, Clock, BookMarked,
} from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import RoleBadge from '@/components/secretaria/RoleBadge'

export const dynamic = 'force-dynamic'

const GRADES_FUND1 = ['Educação Infantil','1º Ano Fundamental','2º Ano Fundamental','3º Ano Fundamental','4º Ano Fundamental','5º Ano Fundamental']
const GRADES_FUND2 = ['6º Ano Fundamental','7º Ano Fundamental','8º Ano Fundamental','9º Ano Fundamental','1ª Série Médio','2ª Série Médio','3ª Série Médio']
const GRADES_ALL   = [...GRADES_FUND1, ...GRADES_FUND2]

const NAV_ITEMS = [
  { href: '/secretaria',                  icon: CalendarDays,  label: 'Agendamentos',    key: 'dashboard' },
  { href: '/secretaria/professores',      icon: Users,         label: 'Professores',     key: 'professores' },
  { href: '/secretaria/disciplinas',      icon: BookOpen,      label: 'Disciplinas',     key: 'disciplinas' },
  { href: '/secretaria/segunda-chamada',  icon: ClipboardList, label: 'Segunda Chamada', key: 'segunda-chamada' },
  { href: '/secretaria/recuperacao',      icon: BookMarked,    label: 'Recuperação',     key: 'recuperacao' },
]

type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
type Subject       = { id: string; name: string; grade: string }
type RecoveryBooking = {
  id: string; studentName: string; parentName: string; parentEmail: string
  parentPhone: string; subjects: string; status: BookingStatus; fileUrl?: string | null; createdAt: string
}
type RecoverySchedule = {
  id: string; subjectName: string; grade: string; type: string; period?: string | null
  date: string; startTime: string; endTime: string; active: boolean; bookings: RecoveryBooking[]
}

const STATUS_META: Record<BookingStatus, { label: string; bg: string; color: string; border: string }> = {
  PENDING:  { label: 'Pendente',  bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  APPROVED: { label: 'Aprovado',  bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
  REJECTED: { label: 'Reprovado', bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
}

function StatusBadge({ status }: { status?: BookingStatus }) {
  const s = STATUS_META[status ?? 'PENDING']
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, padding: '3px 9px', borderRadius: 6, whiteSpace: 'nowrap', border: `1px solid ${s.border}` }}>{s.label}</span>
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Fortaleza' })
}

// Modal reprovação
function RejectModal({ studentName, onConfirm, onCancel }: { studentName: string; onConfirm: (r: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('')
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ position: 'relative', background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <XCircle style={{ width: 26, height: 26, color: '#ef4444' }} />
        </div>
        <h3 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 800, fontSize: 18, color: '#0a1a0d', margin: '0 0 6px' }}>Reprovar inscrição</h3>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>Aluno: <strong>{studentName}</strong></p>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Motivo (opcional)</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex: documentação insuficiente..." rows={3}
          style={{ width: '100%', borderRadius: 10, border: '1.5px solid rgba(239,68,68,0.25)', background: '#fff5f5', color: '#0a1a0d', padding: '10px 12px', fontFamily: 'inherit', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 20 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.1)', background: 'white', color: '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => onConfirm(reason)} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: '#ef4444', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: '"Roboto Slab",serif' }}>
            <XCircle style={{ width: 14, height: 14 }} />Reprovar e enviar e-mail
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function RecuperacaoSecretariaPage() {
  const { data: session } = useSession()
  const role   = (session?.user as any)?.role ?? 'geral'
  const grades = role === 'fund1' ? GRADES_FUND1 : role === 'fund2' ? GRADES_FUND2 : GRADES_ALL

  const [schedules, setSchedules] = useState<RecoverySchedule[]>([])
  const [subjects,  setSubjects]  = useState<Subject[]>([])
  const [loading,   setLoading]   = useState(true)
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const [acting,    setActing]    = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<{ id: string; studentName: string } | null>(null)
  const [filterPending, setFilterPending] = useState(false)

  // Form
  const [selGrade,   setSelGrade]   = useState('')
  const [selSubject, setSelSubject] = useState('')
  const [selType,    setSelType]    = useState<'normal' | 'paralela'>('normal')
  const [selPeriod,  setSelPeriod]  = useState<'meio' | 'final' | ''>('')
  const [examDate,   setExamDate]   = useState('')
  const [startTime,  setStartTime]  = useState('')
  const [endTime,    setEndTime]    = useState('')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  // Fund1 → sempre normal, Fund2 → sempre paralela
  const isFund1Grade = GRADES_FUND1.includes(selGrade)
  const effectiveType = isFund1Grade ? 'normal' : 'paralela'

  const availableSubjects = subjects.filter(s => s.grade === selGrade)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [sRes, dRes] = await Promise.all([fetch('/api/recuperacao'), fetch('/api/disciplinas')])
      if (!sRes.ok || !dRes.ok) throw new Error()
      setSchedules(await sRes.json())
      setSubjects(await dRes.json())
    } catch { toast.error('Falha ao carregar dados.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { setSelSubject(''); setSelPeriod('') }, [selGrade])

  function updateBookingLocally(id: string, patch: Partial<RecoveryBooking>) {
    setSchedules(prev => prev.map(s => ({ ...s, bookings: s.bookings.map(b => b.id === id ? { ...b, ...patch } : b) })))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!selSubject || !selGrade || !examDate || !startTime || !endTime) { setError('Preencha todos os campos.'); return }
    if (startTime >= endTime) { setError('Horário de fim deve ser após o início.'); return }
    if (effectiveType === 'normal' && !selPeriod) { setError('Selecione o período (meio ou final do ano).'); return }
    const subject = subjects.find(s => s.id === selSubject)
    if (!subject) { setError('Disciplina inválida.'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/recuperacao', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: selSubject, subjectName: subject.name, grade: selGrade, type: effectiveType, period: effectiveType === 'normal' ? selPeriod : null, date: examDate, startTime, endTime }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao criar'); return }
      setExamDate(''); setStartTime(''); setEndTime(''); setSelPeriod('')
      toast.success('Slot criado!'); loadData()
    } catch { setError('Erro de conexão') }
    finally { setSaving(false) }
  }

  async function handleDeleteSlot(id: string) {
    if (!confirm('Remover este slot?')) return
    const res = await fetch(`/api/recuperacao/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Falha ao remover.'); return }
    toast.success('Slot removido.'); loadData()
  }

  async function handleApprove(id: string) {
    setActing(id); updateBookingLocally(id, { status: 'APPROVED' })
    try {
      const res = await fetch(`/api/recuperacao/booking/${id}/approve`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success('✅ Aprovado e e-mail enviado!')
    } catch { updateBookingLocally(id, { status: 'PENDING' }); toast.error('Falha ao aprovar.') }
    finally { setActing(null) }
  }

  async function confirmReject(reason: string) {
    if (!rejectTarget) return
    const { id } = rejectTarget; setRejectTarget(null)
    setActing(id); updateBookingLocally(id, { status: 'REJECTED' })
    try {
      const res = await fetch(`/api/recuperacao/booking/${id}/reject`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectReason: reason }),
      })
      if (!res.ok) throw new Error()
      toast.success('❌ Reprovado e e-mail enviado.')
    } catch { updateBookingLocally(id, { status: 'PENDING' }); toast.error('Falha ao reprovar.') }
    finally { setActing(null) }
  }

  // Agrupa por tipo → série → data
  const grouped = schedules.reduce((acc, s) => {
    const key = `${s.type}|${s.grade}|${s.subjectName}`
    if (!acc[key]) acc[key] = { type: s.type, grade: s.grade, subjectName: s.subjectName, slots: [] }
    acc[key].slots.push(s); return acc
  }, {} as Record<string, { type: string; grade: string; subjectName: string; slots: RecoverySchedule[] }>)

  const globalCounts = schedules.reduce(
    (acc, s) => { s.bookings.forEach(b => { acc[b.status ?? 'PENDING'] = (acc[b.status ?? 'PENDING'] ?? 0) + 1 }); return acc },
    { PENDING: 0, APPROVED: 0, REJECTED: 0 } as Record<BookingStatus, number>
  )

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(97,206,112,0.2)', fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#0a1a0d', background: 'white' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#6b8f72', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }

  return (
    <div style={{ minHeight: '100vh', background: '#f7fdf8' }}>
      <Toaster position="top-right" richColors closeButton />
      <AnimatePresence>{rejectTarget && <RejectModal studentName={rejectTarget.studentName} onConfirm={confirmReject} onCancel={() => setRejectTarget(null)} />}</AnimatePresence>

      <header style={{ background: 'linear-gradient(135deg,#0D2818 0%,#1a7a2e 100%)', borderBottom: '1px solid rgba(97,206,112,0.15)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Pro Campus" style={{ width: 34, height: 34, objectFit: 'contain', flexShrink: 0 }} />
              <div>
                <p style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 800, color: 'white', fontSize: 15, margin: 0 }}>Pro Campus</p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 2 }}>Secretaria</p>
              </div>
            </div>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {NAV_ITEMS.map(item => (
              <Link key={item.key} href={item.href} style={{ textDecoration: 'none' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: item.key === 'recuperacao' ? 'rgba(255,255,255,0.15)' : 'transparent', color: item.key === 'recuperacao' ? 'white' : 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
                  <item.icon style={{ width: 14, height: 14 }} />{item.label}
                </button>
              </Link>
            ))}
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.12)', margin: '0 4px' }} />
            <RoleBadge />
            <button onClick={() => signOut({ callbackUrl: '/secretaria/login' })} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, background: 'transparent', color: 'rgba(255,255,255,0.5)' }}>
              <LogOut style={{ width: 15, height: 15 }} />Sair
            </button>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 16px 60px' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 800, fontSize: 24, color: '#0a1a0d', margin: 0 }}>Recuperação</h2>
          <p style={{ color: '#6b8f72', fontSize: 13, marginTop: 4 }}>Gerencie slots de recuperação normal (Fund1) e paralela (Fund2)</p>

          {!loading && (globalCounts.PENDING + globalCounts.APPROVED + globalCounts.REJECTED) > 0 && (
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              {(['PENDING','APPROVED','REJECTED'] as BookingStatus[]).map(s => (
                <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: STATUS_META[s].color, background: STATUS_META[s].bg, padding: '5px 12px', borderRadius: 8, border: `1px solid ${STATUS_META[s].border}` }}>
                  {globalCounts[s]} {STATUS_META[s].label}{globalCounts[s] !== 1 ? 's' : ''}
                </span>
              ))}
              <button onClick={() => setFilterPending(f => !f)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8, border: filterPending ? '1px solid #23A455' : '1px solid rgba(97,206,112,0.3)', background: filterPending ? '#23A455' : 'white', color: filterPending ? 'white' : '#23A455', cursor: 'pointer' }}>
                {filterPending ? 'Mostrando só pendentes' : 'Mostrar só pendentes'}
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)', gap: 24, alignItems: 'start' }}>

          {/* Formulário */}
          <div style={{ background: 'white', borderRadius: 18, border: '1.5px solid rgba(97,206,112,0.15)', padding: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.04)', position: 'sticky', top: 76 }}>
            <h3 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 700, fontSize: 16, color: '#0a1a0d', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus style={{ width: 16, height: 16, color: '#23A455' }} />Novo Slot de Recuperação
            </h3>
            <p style={{ fontSize: 12, color: '#6b8f72', marginBottom: 18 }}>
              Fund1 → Recuperação Normal (paga) · Fund2 → Paralela (gratuita)
            </p>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Série */}
              <div>
                <label style={labelStyle}>Série</label>
                <div style={{ position: 'relative' }}>
                  <select value={selGrade} onChange={e => setSelGrade(e.target.value)} style={{ ...inputStyle, appearance: 'none', paddingRight: 32, cursor: 'pointer', color: selGrade ? '#0a1a0d' : '#9ca3af' }}>
                    <option value="">Selecione a série</option>
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <ChevronDown style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#6b8f72', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Tipo — automático com badge informativo */}
              {selGrade && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: isFund1Grade ? '#fff7ed' : '#f0fdf4', border: `1px solid ${isFund1Grade ? '#fed7aa' : '#bbf7d0'}` }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: isFund1Grade ? '#c2410c' : '#15803d' }}>
                    {isFund1Grade ? '💰 Recuperação Normal — R$ 30,00' : '✅ Recuperação Paralela — Gratuita'}
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: isFund1Grade ? '#92400e' : '#166534' }}>
                    {isFund1Grade ? 'Série do Fund I — pagamento via PIX' : 'Série do Fund II — sem cobrança'}
                  </p>
                </div>
              )}

              {/* Período — só para normal (Fund1) */}
              {selGrade && isFund1Grade && (
                <div>
                  <label style={labelStyle}>Período</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[{ v: 'meio', l: 'Meio do Ano' }, { v: 'final', l: 'Final do Ano' }].map(p => (
                      <button key={p.v} type="button" onClick={() => setSelPeriod(p.v as 'meio' | 'final')}
                        style={{ flex: 1, padding: '10px 8px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${selPeriod === p.v ? '#23A455' : 'rgba(97,206,112,0.2)'}`, background: selPeriod === p.v ? '#e8f9eb' : 'white', color: selPeriod === p.v ? '#23A455' : '#6b8f72' }}>
                        {p.l}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Disciplina */}
              <div>
                <label style={labelStyle}>Disciplina</label>
                <div style={{ position: 'relative' }}>
                  <select value={selSubject} onChange={e => setSelSubject(e.target.value)} disabled={!selGrade} style={{ ...inputStyle, appearance: 'none', paddingRight: 32, cursor: selGrade ? 'pointer' : 'not-allowed', color: selSubject ? '#0a1a0d' : '#9ca3af', opacity: selGrade ? 1 : 0.5 }}>
                    <option value="">Selecione a disciplina</option>
                    {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ChevronDown style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#6b8f72', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Data */}
              <div>
                <label style={labelStyle}>Data da prova</label>
                <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#23A455'; e.target.style.boxShadow = '0 0 0 3px rgba(97,206,112,0.1)' }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.boxShadow = 'none' }} />
              </div>

              {/* Horários */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[['Início', startTime, setStartTime], ['Fim', endTime, setEndTime]].map(([lbl, val, setter]) => (
                  <div key={lbl as string}>
                    <label style={labelStyle}>{lbl as string}</label>
                    <input type="time" value={val as string} onChange={e => (setter as any)(e.target.value)} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = '#23A455'; e.target.style.boxShadow = '0 0 0 3px rgba(97,206,112,0.1)' }}
                      onBlur={e  => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.boxShadow = 'none' }} />
                  </div>
                ))}
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13 }}>
                  <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />{error}
                  <button type="button" onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><X style={{ width: 13, height: 13 }} /></button>
                </div>
              )}

              <button type="submit" disabled={saving} style={{ padding: '12px', borderRadius: 10, border: 'none', background: saving ? 'rgba(35,164,85,0.2)' : 'linear-gradient(135deg,#23A455,#61CE70)', color: saving ? 'rgba(255,255,255,0.5)' : 'white', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: '"Roboto Slab",serif', boxShadow: saving ? 'none' : '0 4px 16px rgba(35,164,85,0.3)' }}>
                {saving ? 'Salvando...' : <><Plus style={{ width: 15, height: 15 }} />Adicionar Slot</>}
              </button>
            </form>
          </div>

          {/* Lista */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? <LoadingSpinner /> : Object.keys(grouped).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', background: 'white', borderRadius: 20, border: '1.5px dashed rgba(97,206,112,0.3)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
                <p style={{ fontWeight: 600, color: '#3d5c42', fontSize: 16 }}>Nenhum slot cadastrado</p>
                <p style={{ color: '#6b8f72', fontSize: 14, marginTop: 6 }}>Use o formulário ao lado para adicionar slots de recuperação.</p>
              </div>
            ) : Object.entries(grouped).map(([key, group]) => {
              const allBookings   = group.slots.flatMap(s => s.bookings)
              const pendingCount  = allBookings.filter(b => (b.status ?? 'PENDING') === 'PENDING').length
              if (filterPending && pendingCount === 0) return null
              const isNormal      = group.type === 'normal'
              const accentColor   = isNormal ? '#f59e0b' : '#23A455'
              const accentBg      = isNormal ? '#fef3c7' : '#e8f9eb'
              const accentBorder  = isNormal ? '#fde68a' : '#bbf7d0'

              return (
                <motion.div key={key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: 'white', borderRadius: 16, border: `1.5px solid ${accentBorder}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>

                  <button onClick={() => setExpanded(expanded === key ? null : key)}
                    style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${accentBorder}` }}>
                        <BookMarked style={{ width: 18, height: 18, color: accentColor }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 15, color: '#0a1a0d', margin: 0 }}>{group.subjectName}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                          <p style={{ fontSize: 12, color: '#6b8f72', margin: 0 }}>{group.grade}</p>
                          <span style={{ fontSize: 11, fontWeight: 700, color: accentColor, background: accentBg, padding: '1px 8px', borderRadius: 5, border: `1px solid ${accentBorder}` }}>
                            {isNormal ? '💰 Normal' : '✅ Paralela'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#23A455', background: '#e8f9eb', borderRadius: 999, padding: '4px 10px' }}>{group.slots.length} slot{group.slots.length !== 1 ? 's' : ''}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#4054B2', background: '#eef1fb', borderRadius: 999, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users2 style={{ width: 12, height: 12 }} />{allBookings.length} inscrito{allBookings.length !== 1 ? 's' : ''}
                      </span>
                      {pendingCount > 0 && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#b45309', background: '#fef3c7', borderRadius: 999, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock style={{ width: 11, height: 11 }} />{pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      <motion.div animate={{ rotate: expanded === key ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown style={{ width: 15, height: 15, color: '#6b8f72' }} />
                      </motion.div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {expanded === key && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                        <div style={{ borderTop: `1px solid ${accentBorder}`, padding: '16px 20px', background: '#fafdfb', display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {group.slots.map(slot => {
                            const vis = filterPending ? slot.bookings.filter(b => (b.status ?? 'PENDING') === 'PENDING') : slot.bookings
                            const periodLabel = slot.period === 'meio' ? '📅 Meio do Ano' : slot.period === 'final' ? '📅 Final do Ano' : ''
                            return (
                              <div key={slot.id} style={{ background: 'white', borderRadius: 12, border: `1px solid ${accentBorder}`, overflow: 'hidden' }}>
                                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: accentBg }}>
                                  <div>
                                    <p style={{ fontWeight: 700, fontSize: 14, color: '#0a1a0d', margin: 0, textTransform: 'capitalize' }}>{formatDate(slot.date)}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                                      <p style={{ fontSize: 13, color: accentColor, fontWeight: 600, margin: 0 }}>{slot.startTime} – {slot.endTime}</p>
                                      {periodLabel && <span style={{ fontSize: 11, color: '#6b8f72' }}>{periodLabel}</span>}
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 12, color: '#23A455', background: 'white', borderRadius: 999, padding: '3px 10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, border: '1px solid #bbf7d0' }}>
                                      <Users2 style={{ width: 11, height: 11 }} />{slot.bookings.length}
                                    </span>
                                    <button onClick={() => handleDeleteSlot(slot.id)} style={{ padding: 6, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 8, color: '#ef4444' }}
                                      onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                      <Trash2 style={{ width: 14, height: 14 }} />
                                    </button>
                                  </div>
                                </div>

                                {vis.length > 0 && (
                                  <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>Inscritos</p>
                                    {vis.map((b, i) => {
                                      const isBusy      = acting === b.id
                                      const subjectsList = b.subjects ? b.subjects.split(',').map(x => x.trim()).filter(Boolean) : []
                                      return (
                                        <div key={b.id} style={{ borderRadius: 10, border: '1px solid #e5e7eb', background: '#fafafa', overflow: 'hidden' }}>
                                          <div style={{ padding: '10px 14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                              <span style={{ fontSize: 13, fontWeight: 700, color: '#0a1a0d' }}>{b.studentName}</span>
                                              <span style={{ fontSize: 10, color: '#9ca3af' }}>#{i + 1}</span>
                                              <StatusBadge status={b.status as BookingStatus} />
                                            </div>
                                            <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>
                                              Resp: <strong style={{ color: '#374151' }}>{b.parentName}</strong> · {b.parentEmail} · {b.parentPhone}
                                            </p>
                                            {subjectsList.length > 0 && (
                                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                                                {subjectsList.map(sub => (
                                                  <span key={sub} style={{ fontSize: 11, fontWeight: 600, color: '#23A455', background: '#e8f9eb', padding: '2px 8px', borderRadius: 5, border: '1px solid #bbf7d0' }}>{sub}</span>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                          <div style={{ padding: '8px 14px', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                            {b.status !== 'APPROVED' && (
                                              <button onClick={() => handleApprove(b.id)} disabled={isBusy}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'white', background: isBusy ? '#86efac' : '#22c55e', border: 'none', padding: '6px 14px', borderRadius: 7, cursor: isBusy ? 'not-allowed' : 'pointer' }}>
                                                <CheckCircle style={{ width: 12, height: 12 }} />{isBusy ? '...' : 'Aprovar'}
                                              </button>
                                            )}
                                            {b.status !== 'REJECTED' && (
                                              <button onClick={() => setRejectTarget({ id: b.id, studentName: b.studentName })} disabled={isBusy}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'white', background: isBusy ? '#fca5a5' : '#ef4444', border: 'none', padding: '6px 14px', borderRadius: 7, cursor: isBusy ? 'not-allowed' : 'pointer' }}>
                                                <XCircle style={{ width: 12, height: 12 }} />{isBusy ? '...' : 'Reprovar'}
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                                {vis.length === 0 && (
                                  <div style={{ padding: '14px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                                    {filterPending && slot.bookings.length > 0 ? 'Nenhum inscrito pendente.' : 'Nenhum inscrito neste slot.'}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
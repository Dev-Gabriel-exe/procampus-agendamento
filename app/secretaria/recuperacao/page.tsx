'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast, Toaster } from 'sonner'
import Link from 'next/link'
import {
  CalendarDays, Users, LogOut, BookOpen, ClipboardList,
  Plus, Trash2, ChevronDown, AlertCircle, X, Users2,
  CheckCircle, XCircle, Clock, BookMarked, FolderOpen,
  Search, SlidersHorizontal, Download, ExternalLink,
  Paperclip, Filter, Copy,
} from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import RoleBadge from '@/components/secretaria/RoleBadge'
import { extractTurma } from '@/lib/turmas'

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
type ActiveTab     = 'slots' | 'comprovantes'
type CompFilter    = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED'
type Subject       = { id: string; name: string; grade: string }

type RecoveryBooking = {
  id: string; studentName: string; studentGrade: string; parentName: string; parentEmail: string
  parentPhone: string; subjects: string; status: BookingStatus; fileUrl?: string | null; createdAt: string
}
type RecoverySchedule = {
  id: string; subjectName: string; grade: string; type: string; period?: string | null
  date: string; startTime: string; endTime: string; active: boolean; bookings: RecoveryBooking[]
}
type ComprovanteBooking = RecoveryBooking & {
  recoverySchedule: {
    subjectName: string; grade: string; date: string; startTime: string; endTime: string; type: string
  }
}

const STATUS_META: Record<BookingStatus, { label: string; bg: string; color: string; border: string; icon: React.ReactNode }> = {
  PENDING:  { label: 'Pendente',  bg: '#fef3c7', color: '#b45309', border: '#fde68a', icon: <Clock      style={{ width: 10, height: 10 }} /> },
  APPROVED: { label: 'Aprovado',  bg: '#dcfce7', color: '#166534', border: '#bbf7d0', icon: <CheckCircle style={{ width: 10, height: 10 }} /> },
  REJECTED: { label: 'Reprovado', bg: '#fee2e2', color: '#991b1b', border: '#fecaca', icon: <XCircle    style={{ width: 10, height: 10 }} /> },
}

const PIX_KEY  = 'financeiro@procampus.com.br'
const PIX_NAME = 'SOCIEDADE EDUCACIONAL DO PIAUI S/S LTDA'

function StatusBadge({ status }: { status?: BookingStatus }) {
  const s = STATUS_META[status ?? 'PENDING']
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, padding: '3px 9px', borderRadius: 6, whiteSpace: 'nowrap', border: `1px solid ${s.border}` }}>
      {s.icon}{s.label}
    </span>
  )
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Fortaleza' })
}
function formatDateShort(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Fortaleza' })
}
function formatDateTime(date: string) {
  return new Date(date).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' })
}

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
          <button onClick={() => onConfirm(reason)} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: '#ef4444', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <XCircle style={{ width: 14, height: 14 }} />Reprovar e enviar e-mail
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function DeleteModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ position: 'relative', background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Trash2 style={{ width: 22, height: 22, color: '#ef4444' }} />
        </div>
        <h3 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 800, fontSize: 17, color: '#0a1a0d', margin: '0 0 8px' }}>Apagar registro?</h3>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 22px', lineHeight: 1.5 }}>
          O registro de <strong style={{ color: '#374151' }}>{name}</strong> será removido permanentemente.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: 'white', color: '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={onConfirm} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: '#ef4444', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Trash2 style={{ width: 14, height: 14 }} />Apagar
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

  const [activeTab, setActiveTab] = useState<ActiveTab>('slots')

  const [schedules,     setSchedules]     = useState<RecoverySchedule[]>([])
  const [subjects,      setSubjects]      = useState<Subject[]>([])
  const [loading,       setLoading]       = useState(true)
  const [expanded,      setExpanded]      = useState<string | null>(null)
  const [acting,        setActing]        = useState<string | null>(null)
  const [rejectTarget,  setRejectTarget]  = useState<{ id: string; studentName: string } | null>(null)
  const [filterPending, setFilterPending] = useState(false)

  // ✅ DELETE booking dentro do slot
  const [deleteBookingTarget, setDeleteBookingTarget] = useState<{ id: string; name: string } | null>(null)
  const [deletingBooking,     setDeletingBooking]     = useState<string | null>(null)

  const [comprovantes,     setComprovantes]     = useState<ComprovanteBooking[]>([])
  const [loadingComp,      setLoadingComp]      = useState(false)
  const [expandedComp,     setExpandedComp]     = useState<string | null>(null)
  const [deleteTarget,     setDeleteTarget]     = useState<{ id: string; name: string } | null>(null)
  const [deletingComp,     setDeletingComp]     = useState<string | null>(null)
  const [compSearch,       setCompSearch]       = useState('')
  const [compFilter,       setCompFilter]       = useState<CompFilter>('all')
  const [compFilterTurma,  setCompFilterTurma]  = useState('')
  const [actingComp,       setActingComp]       = useState<string | null>(null)
  const [rejectTargetComp, setRejectTargetComp] = useState<{ id: string; studentName: string } | null>(null)

  const [selGrade,   setSelGrade]   = useState('')
  const [selSubject, setSelSubject] = useState('')
  const [selPeriod,  setSelPeriod]  = useState<'meio' | 'final' | ''>('')
  const [examDate,   setExamDate]   = useState('')
  const [startTime,  setStartTime]  = useState('')
  const [endTime,    setEndTime]    = useState('')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  // Lote de seleção: { [grade]: disciplinaId[] }
  const [loteSelecao,  setLoteSelecao]  = useState<Record<string, string[]>>({})
  const [lotePeriodos, setLotePeriodos] = useState<Record<string, 'meio' | 'final'>>({})

  const totalLote = Object.values(loteSelecao).reduce((s, ids) => s + ids.length, 0)

  const isFund1Grade      = GRADES_FUND1.includes(selGrade)
  const effectiveType     = isFund1Grade ? 'normal' : 'paralela'
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

  const loadComprovantes = useCallback(async () => {
    setLoadingComp(true)
    try {
      const res = await fetch('/api/recuperacao/comprovantes')
      if (!res.ok) throw new Error()
      setComprovantes(await res.json())
    } catch { toast.error('Falha ao carregar comprovantes.') }
    finally { setLoadingComp(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { setSelSubject(''); setSelPeriod('') }, [selGrade])
  useEffect(() => { if (activeTab === 'comprovantes') loadComprovantes() }, [activeTab, loadComprovantes])

  function updateBookingLocally(id: string, patch: Partial<RecoveryBooking>) {
    setSchedules(prev => prev.map(s => ({ ...s, bookings: s.bookings.map(b => b.id === id ? { ...b, ...patch } : b) })))
  }
  function removeBookingLocally(id: string) {
    setSchedules(prev => prev.map(s => ({ ...s, bookings: s.bookings.filter(b => b.id !== id) })))
  }
  function updateCompLocally(id: string, patch: Partial<ComprovanteBooking>) {
    setComprovantes(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
  }

  // ✅ CORRIGIDO: copia só data e horário, mantém série/disciplina/período intactos
  function handleCopySlot(slot: RecoverySchedule) {
    const dateStr = slot.date.split('T')[0]
    setExamDate(dateStr)
    setStartTime(slot.startTime)
    setEndTime(slot.endTime)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast.info('📋 Data e horário copiados! Ajuste os outros campos se necessário.')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!examDate || !startTime || !endTime) { setError('Preencha a data e os horários.'); return }
    if (startTime >= endTime) { setError('Horário de fim deve ser após o início.'); return }
    if (totalLote === 0) { setError('Selecione pelo menos uma disciplina.'); return }

    // Valida períodos do Fund1
    for (const [grade, ids] of Object.entries(loteSelecao)) {
      if (ids.length > 0 && GRADES_FUND1.includes(grade) && !lotePeriodos[grade]) {
        setError(`Selecione o período (Meio ou Final) para: ${grade}`); return
      }
    }

    setSaving(true)
    let criados = 0; let erros = 0

    for (const [grade, discIds] of Object.entries(loteSelecao)) {
      if (discIds.length === 0) continue
      const isF1    = GRADES_FUND1.includes(grade)
      const type    = isF1 ? 'normal' : 'paralela'
      const period  = isF1 ? lotePeriodos[grade] : null

      for (const discId of discIds) {
        const subject = subjects.find(s => s.id === discId)
        if (!subject) continue
        try {
          const res = await fetch('/api/recuperacao', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subjectId: discId, subjectName: subject.name, grade, type, period, date: examDate, startTime, endTime }),
          })
          if (res.ok) criados++; else erros++
        } catch { erros++ }
      }
    }

    setSaving(false)
    if (criados > 0) {
      toast.success(`✅ ${criados} slot${criados !== 1 ? 's' : ''} criado${criados !== 1 ? 's' : ''}!${erros > 0 ? ` (${erros} já existiam)` : ''}`)
      setLoteSelecao({}); setLotePeriodos({}); setExamDate(''); setStartTime(''); setEndTime('')
      loadData()
    } else {
      setError(`Erro: ${erros} slot${erros !== 1 ? 's' : ''} já existem ou falharam.`)
    }
  }

  async function handleDeleteSlot(id: string) {
    if (!confirm('Remover este slot? Todas as inscrições vinculadas também serão removidas.')) return
    const res = await fetch(`/api/recuperacao/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Falha ao remover.'); return }
    toast.success('Slot removido.'); loadData()
  }

  // ✅ NOVO: delete de inscrição individual do pai (dentro do slot)
  async function confirmDeleteBooking() {
    if (!deleteBookingTarget) return
    const { id, name } = deleteBookingTarget; setDeleteBookingTarget(null)
    setDeletingBooking(id)
    removeBookingLocally(id)
    try {
      const res = await fetch(`/api/recuperacao/booking/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(`Inscrição de ${name} removida.`)
    } catch { toast.error('Falha ao remover inscrição.'); loadData() }
    finally { setDeletingBooking(null) }
  }

  async function handleApprove(id: string) {
    setActing(id); updateBookingLocally(id, { status: 'APPROVED' })
    try {
      const res = await fetch(`/api/recuperacao/booking/${id}/approve`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success('✅ Aprovado!')
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
      toast.success('❌ Reprovado.')
    } catch { updateBookingLocally(id, { status: 'PENDING' }); toast.error('Falha ao reprovar.') }
    finally { setActing(null) }
  }

  async function handleApproveComp(id: string) {
    setActingComp(id); updateCompLocally(id, { status: 'APPROVED' })
    try {
      const res = await fetch(`/api/recuperacao/booking/${id}/approve`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success('✅ Aprovado!')
    } catch { updateCompLocally(id, { status: 'PENDING' }); toast.error('Falha ao aprovar.') }
    finally { setActingComp(null) }
  }

  async function confirmRejectComp(reason: string) {
    if (!rejectTargetComp) return
    const { id } = rejectTargetComp; setRejectTargetComp(null)
    setActingComp(id); updateCompLocally(id, { status: 'REJECTED' })
    try {
      const res = await fetch(`/api/recuperacao/booking/${id}/reject`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectReason: reason }),
      })
      if (!res.ok) throw new Error()
      toast.success('❌ Reprovado.')
    } catch { updateCompLocally(id, { status: 'PENDING' }); toast.error('Falha ao reprovar.') }
    finally { setActingComp(null) }
  }

  async function confirmDeleteComp() {
    if (!deleteTarget) return
    const { id, name } = deleteTarget; setDeleteTarget(null)
    setDeletingComp(id)
    setComprovantes(prev => prev.filter(c => c.id !== id))
    try {
      const res = await fetch(`/api/recuperacao/booking/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(`Comprovante de ${name} removido.`)
    } catch { toast.error('Falha ao remover.'); loadComprovantes() }
    finally { setDeletingComp(null) }
  }

  const grouped = schedules.reduce((acc, s) => {
    const key = `${s.type}|${s.grade}|${s.subjectName}`
    if (!acc[key]) acc[key] = { type: s.type, grade: s.grade, subjectName: s.subjectName, slots: [] }
    acc[key].slots.push(s); return acc
  }, {} as Record<string, { type: string; grade: string; subjectName: string; slots: RecoverySchedule[] }>)

  const globalCounts = schedules.reduce(
    (acc, s) => { s.bookings.forEach(b => { acc[b.status ?? 'PENDING'] = (acc[b.status ?? 'PENDING'] ?? 0) + 1 }); return acc },
    { PENDING: 0, APPROVED: 0, REJECTED: 0 } as Record<BookingStatus, number>
  )

  const compCounts = comprovantes.reduce(
    (acc, b) => { const s = b.status ?? 'PENDING'; acc[s] = (acc[s] ?? 0) + 1; return acc },
    { PENDING: 0, APPROVED: 0, REJECTED: 0 } as Record<BookingStatus, number>
  )

  const todasTurmasComp = [...new Set(
    comprovantes.map(b => extractTurma(b.studentGrade)).filter(Boolean)
  )].sort()

  const filteredComps = comprovantes.filter(b => {
    const matchSearch = compSearch.trim() === '' ||
      b.parentName.toLowerCase().includes(compSearch.toLowerCase()) ||
      b.studentName.toLowerCase().includes(compSearch.toLowerCase())
    const matchStatus = compFilter === 'all' || (b.status ?? 'PENDING') === compFilter
    const matchTurma  = !compFilterTurma || extractTurma(b.studentGrade) === compFilterTurma
    return matchSearch && matchStatus && matchTurma
  })

  const pendingCompCount = comprovantes.filter(c => (c.status ?? 'PENDING') === 'PENDING').length

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(97,206,112,0.2)', fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#0a1a0d', background: 'white' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#6b8f72', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }

  return (
    <div style={{ minHeight: '100vh', background: '#f7fdf8' }}>
      <Toaster position="top-right" richColors closeButton />
      <AnimatePresence>
        {rejectTarget        && <RejectModal studentName={rejectTarget.studentName}        onConfirm={confirmReject}     onCancel={() => setRejectTarget(null)} />}
        {rejectTargetComp    && <RejectModal studentName={rejectTargetComp.studentName}    onConfirm={confirmRejectComp} onCancel={() => setRejectTargetComp(null)} />}
        {deleteTarget        && <DeleteModal name={deleteTarget.name}        onConfirm={confirmDeleteComp}   onCancel={() => setDeleteTarget(null)} />}
        {/* ✅ Modal para deletar inscrição dentro do slot */}
        {deleteBookingTarget && <DeleteModal name={deleteBookingTarget.name} onConfirm={confirmDeleteBooking} onCancel={() => setDeleteBookingTarget(null)} />}
      </AnimatePresence>

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

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {([
              { key: 'slots',        label: 'Slots & Inscrições', icon: ClipboardList },
              { key: 'comprovantes', label: 'Comprovantes PIX',   icon: FolderOpen, badge: pendingCompCount || null },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as ActiveTab)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, background: activeTab === tab.key ? '#23A455' : 'white', color: activeTab === tab.key ? 'white' : '#6b8f72', boxShadow: activeTab === tab.key ? '0 4px 16px rgba(35,164,85,0.3)' : '0 1px 4px rgba(0,0,0,0.06)', border: activeTab === tab.key ? 'none' : '1px solid rgba(97,206,112,0.2)', transition: 'all 0.15s' }}>
                <tab.icon style={{ width: 14, height: 14 }} />{tab.label}
                {(tab as any).badge ? <span style={{ background: '#f97316', color: 'white', borderRadius: 999, fontSize: 10, fontWeight: 800, padding: '1px 6px', marginLeft: 2 }}>{(tab as any).badge}</span> : null}
              </button>
            ))}
          </div>

          {activeTab === 'slots' && !loading && (globalCounts.PENDING + globalCounts.APPROVED + globalCounts.REJECTED) > 0 && (
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              {(['PENDING','APPROVED','REJECTED'] as BookingStatus[]).map(s => (
                <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: STATUS_META[s].color, background: STATUS_META[s].bg, padding: '5px 12px', borderRadius: 8, border: `1px solid ${STATUS_META[s].border}` }}>
                  {STATUS_META[s].icon}{globalCounts[s]} {STATUS_META[s].label}{globalCounts[s] !== 1 ? 's' : ''}
                </span>
              ))}
              <button onClick={() => setFilterPending(f => !f)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8, border: filterPending ? '1px solid #23A455' : '1px solid rgba(97,206,112,0.3)', background: filterPending ? '#23A455' : 'white', color: filterPending ? 'white' : '#23A455', cursor: 'pointer' }}>
                <Filter style={{ width: 12, height: 12 }} />{filterPending ? 'Mostrando só pendentes' : 'Mostrar só pendentes'}
              </button>
            </div>
          )}
        </div>

        {/* ════════ ABA: SLOTS ════════ */}
        {activeTab === 'slots' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)', gap: 24, alignItems: 'start' }}>

            {/* Formulário — criação em lote */}
            <div style={{ background: 'white', borderRadius: 18, border: '1.5px solid rgba(97,206,112,0.15)', padding: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.04)', position: 'sticky', top: 76 }}>
              <h3 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 700, fontSize: 16, color: '#0a1a0d', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus style={{ width: 16, height: 16, color: '#23A455' }} />Novo Slot de Recuperação
              </h3>
              <p style={{ fontSize: 12, color: '#6b8f72', marginBottom: 18 }}>
                Escolha a data e selecione várias séries e disciplinas de uma vez.
              </p>

              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

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

                {/* Séries + Disciplinas em lote */}
                <div>
                  <label style={labelStyle}>Séries e Disciplinas</label>
                  <div style={{ border: '1.5px solid rgba(97,206,112,0.2)', borderRadius: 12, overflow: 'hidden', maxHeight: 340, overflowY: 'auto' }}>
                    {grades.map(grade => {
                      const isF1       = GRADES_FUND1.includes(grade)
                      const discsDaGrade = subjects.filter(s => s.grade === grade)
                      const selecionadas = loteSelecao[grade] ?? []
                      const todas        = selecionadas.length === discsDaGrade.length && discsDaGrade.length > 0

                      return (
                        <div key={grade} style={{ borderBottom: '1px solid rgba(97,206,112,0.1)' }}>
                          {/* Cabeçalho da série */}
                          <div style={{ padding: '10px 14px', background: isF1 ? '#fffbeb' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#0a1a0d' }}>{grade}</span>
                              <span style={{ fontSize: 10, fontWeight: 700, color: isF1 ? '#c2410c' : '#15803d', background: isF1 ? '#fef3c7' : '#dcfce7', padding: '1px 7px', borderRadius: 4 }}>
                                {isF1 ? '💰 Normal' : '✅ Paralela'}
                              </span>
                            </div>
                            {discsDaGrade.length > 0 && (
                              <button type="button"
                                onClick={() => setLoteSelecao(prev => ({
                                  ...prev,
                                  [grade]: todas ? [] : discsDaGrade.map(d => d.id),
                                }))}
                                style={{ fontSize: 11, fontWeight: 600, color: '#23A455', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
                                {todas ? 'Desmarcar todas' : 'Marcar todas'}
                              </button>
                            )}
                          </div>

                          {/* Disciplinas da série */}
                          {discsDaGrade.length === 0 ? (
                            <p style={{ fontSize: 12, color: '#9ca3af', padding: '8px 14px', margin: 0 }}>Nenhuma disciplina cadastrada</p>
                          ) : (
                            <div style={{ padding: '8px 14px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {discsDaGrade.map(d => {
                                const sel = selecionadas.includes(d.id)
                                return (
                                  <button key={d.id} type="button"
                                    onClick={() => setLoteSelecao(prev => {
                                      const cur = prev[grade] ?? []
                                      return { ...prev, [grade]: sel ? cur.filter(x => x !== d.id) : [...cur, d.id] }
                                    })}
                                    style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: sel ? '#23A455' : 'white', color: sel ? 'white' : '#6b7280', border: sel ? '1.5px solid #23A455' : '1.5px solid #e5e7eb', boxShadow: sel ? '0 2px 8px rgba(35,164,85,0.25)' : 'none' }}>
                                    {d.name}
                                  </button>
                                )
                              })}
                            </div>
                          )}

                          {/* Período — só para Fund1 se tiver algo selecionado */}
                          {isF1 && selecionadas.length > 0 && (
                            <div style={{ padding: '0 14px 10px', display: 'flex', gap: 6 }}>
                              {[{ v: 'meio', l: '📅 Meio do Ano' }, { v: 'final', l: '📅 Final do Ano' }].map(p => (
                                <button key={p.v} type="button"
                                  onClick={() => setLotePeriodos(prev => ({ ...prev, [grade]: p.v as 'meio' | 'final' }))}
                                  style={{ flex: 1, padding: '7px 8px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${lotePeriodos[grade] === p.v ? '#f59e0b' : 'rgba(97,206,112,0.2)'}`, background: lotePeriodos[grade] === p.v ? '#fef3c7' : 'white', color: lotePeriodos[grade] === p.v ? '#c2410c' : '#6b8f72' }}>
                                  {p.l}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Resumo do lote */}
                  {totalLote > 0 && (
                    <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#15803d' }}>
                        {totalLote} slot{totalLote !== 1 ? 's' : ''} serão criados
                      </p>
                      <p style={{ margin: '3px 0 0', fontSize: 11, color: '#6b8f72' }}>
                        {Object.entries(loteSelecao)
                          .filter(([, ids]) => ids.length > 0)
                          .map(([grade, ids]) => {
                            const nomes = subjects.filter(s => ids.includes(s.id)).map(s => s.name)
                            return `${grade}: ${nomes.join(', ')}`
                          }).join(' · ')}
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13 }}>
                    <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />{error}
                    <button type="button" onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><X style={{ width: 13, height: 13 }} /></button>
                  </div>
                )}

                <button type="submit" disabled={saving || totalLote === 0} style={{ padding: '12px', borderRadius: 10, border: 'none', background: saving || totalLote === 0 ? 'rgba(35,164,85,0.2)' : 'linear-gradient(135deg,#23A455,#61CE70)', color: saving || totalLote === 0 ? 'rgba(255,255,255,0.5)' : 'white', fontSize: 14, fontWeight: 700, cursor: saving || totalLote === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: '"Roboto Slab",serif', boxShadow: saving || totalLote === 0 ? 'none' : '0 4px 16px rgba(35,164,85,0.3)' }}>
                  {saving ? 'Criando slots...' : <><Plus style={{ width: 15, height: 15 }} />{totalLote > 0 ? `Criar ${totalLote} slot${totalLote !== 1 ? 's' : ''}` : 'Adicionar Slots'}</> }
                </button>
              </form>
            </div>

            {/* Lista de slots */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loading ? <LoadingSpinner /> : Object.keys(grouped).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', background: 'white', borderRadius: 20, border: '1.5px dashed rgba(97,206,112,0.3)' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
                  <p style={{ fontWeight: 600, color: '#3d5c42', fontSize: 16 }}>Nenhum slot cadastrado</p>
                </div>
              ) : Object.entries(grouped).map(([key, group]) => {
                const allBookings  = group.slots.flatMap(s => s.bookings)
                const pendingCount = allBookings.filter(b => (b.status ?? 'PENDING') === 'PENDING').length
                if (filterPending && pendingCount === 0) return null
                const isNormal     = group.type === 'normal'
                const accentColor  = isNormal ? '#f59e0b' : '#23A455'
                const accentBg     = isNormal ? '#fef3c7' : '#e8f9eb'
                const accentBorder = isNormal ? '#fde68a' : '#bbf7d0'

                return (
                  <motion.div key={key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'white', borderRadius: 16, border: `1.5px solid ${accentBorder}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                    <button onClick={() => setExpanded(expanded === key ? null : key)}
                      style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <BookMarked style={{ width: 18, height: 18, color: accentColor }} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 15, color: '#0a1a0d', margin: 0 }}>{group.subjectName}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                            <p style={{ fontSize: 12, color: '#6b8f72', margin: 0 }}>{group.grade}</p>
                            <span style={{ fontSize: 11, fontWeight: 700, color: accentColor, background: accentBg, padding: '1px 8px', borderRadius: 5 }}>
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
                                  {/* Cabeçalho do slot */}
                                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: accentBg }}>
                                    <div>
                                      <p style={{ fontWeight: 700, fontSize: 14, color: '#0a1a0d', margin: 0, textTransform: 'capitalize' }}>{formatDate(slot.date)}</p>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                                        <p style={{ fontSize: 13, color: accentColor, fontWeight: 600, margin: 0 }}>{slot.startTime} – {slot.endTime}</p>
                                        {periodLabel && <span style={{ fontSize: 11, color: '#6b8f72' }}>{periodLabel}</span>}
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <span style={{ fontSize: 12, color: '#23A455', background: 'white', borderRadius: 999, padding: '3px 10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, border: '1px solid #bbf7d0' }}>
                                        <Users2 style={{ width: 11, height: 11 }} />{slot.bookings.length}
                                      </span>
                                      {/* ✅ CORRIGIDO: copia só data e horário */}
                                      <button onClick={() => handleCopySlot(slot)} title="Copiar data e horário para o formulário"
                                        style={{ padding: 6, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 8, color: '#4054B2' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#eef1fb'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <Copy style={{ width: 14, height: 14 }} />
                                      </button>
                                      <button onClick={() => handleDeleteSlot(slot.id)} title="Remover slot"
                                        style={{ padding: 6, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 8, color: '#ef4444' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <Trash2 style={{ width: 14, height: 14 }} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Inscrições */}
                                  {vis.length > 0 && (
                                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                      {vis.map((b, i) => {
                                        const isBusy       = acting === b.id
                                        const isDelBook    = deletingBooking === b.id
                                        const subjectsList = b.subjects ? b.subjects.split(',').map(x => x.trim()).filter(Boolean) : []
                                        return (
                                          <div key={b.id} style={{ borderRadius: 10, border: '1px solid #e5e7eb', background: isDelBook ? '#fef2f2' : '#fafafa', overflow: 'hidden', opacity: isDelBook ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                                            <div style={{ padding: '10px 14px' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                                                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0a1a0d' }}>{b.studentName}</span>
                                                  <span style={{ fontSize: 10, color: '#9ca3af' }}>#{i + 1}</span>
                                                  <StatusBadge status={b.status as BookingStatus} />
                                                </div>
                                                {/* ✅ NOVO: botão de deletar inscrição do pai */}
                                                <button
                                                  onClick={() => setDeleteBookingTarget({ id: b.id, name: b.studentName })}
                                                  disabled={isBusy || isDelBook}
                                                  title="Remover esta inscrição"
                                                  style={{ padding: 5, border: 'none', background: 'transparent', cursor: isBusy || isDelBook ? 'not-allowed' : 'pointer', borderRadius: 7, color: '#ef4444', flexShrink: 0 }}
                                                  onMouseEnter={e => { if (!isBusy && !isDelBook) e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
                                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                  <Trash2 style={{ width: 13, height: 13 }} />
                                                </button>
                                              </div>
                                              <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>
                                                Resp: <strong style={{ color: '#374151' }}>{b.parentName}</strong> · {b.parentEmail} · {b.parentPhone}
                                              </p>
                                              {subjectsList.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                                                  {subjectsList.map(sub => (
                                                    <span key={sub} style={{ fontSize: 11, fontWeight: 600, color: '#23A455', background: '#e8f9eb', padding: '2px 8px', borderRadius: 5 }}>{sub}</span>
                                                  ))}
                                                </div>
                                              )}
                                              {slot.type === 'normal' && (
                                                <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: '#fff7ed', border: '1px solid #fed7aa' }}>
                                                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#c2410c' }}>💰 Taxa de R$ 30,00 — PIX: {PIX_KEY}</p>
                                                  {b.fileUrl
                                                    ? <p style={{ margin: '3px 0 0', fontSize: 11, color: '#15803d', fontWeight: 600 }}>✅ Comprovante enviado</p>
                                                    : <p style={{ margin: '3px 0 0', fontSize: 11, color: '#b45309' }}>⚠️ Aguardando comprovante</p>
                                                  }
                                                </div>
                                              )}
                                            </div>
                                            <div style={{ padding: '8px 14px', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                              {b.fileUrl
                                                ? <a href={b.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#4054B2', textDecoration: 'none', background: '#eef1fb', padding: '4px 10px', borderRadius: 6 }}>
                                                    <Paperclip style={{ width: 11, height: 11 }} />Ver comprovante
                                                  </a>
                                                : <span style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}><Paperclip style={{ width: 11, height: 11 }} />Sem comprovante</span>
                                              }
                                              <div style={{ display: 'flex', gap: 6 }}>
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
        )}

        {/* ════════ ABA: COMPROVANTES PIX ════════ */}
        {activeTab === 'comprovantes' && (
          <div>
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #fed7aa', padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 20 }}>💰</span>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#c2410c' }}>Chave PIX para recuperação normal: {PIX_KEY}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#92400e' }}>Favorecido: {PIX_NAME} · R$ 30,00 por disciplina</p>
              </div>
            </div>

            {!loadingComp && comprovantes.length > 0 && (
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(97,206,112,0.15)', padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                  <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#9ca3af', pointerEvents: 'none' }} />
                  <input value={compSearch} onChange={e => setCompSearch(e.target.value)} placeholder="Buscar por responsável ou aluno..."
                    style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 10, border: '1.5px solid rgba(97,206,112,0.2)', fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#0a1a0d', background: '#f9fafb', boxSizing: 'border-box' as const }} />
                  {compSearch && (
                    <button onClick={() => setCompSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                      <X style={{ width: 13, height: 13 }} />
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <SlidersHorizontal style={{ width: 13, height: 13, color: '#9ca3af' }} />
                  {([
                    { key: 'all',      label: `Todos (${comprovantes.length})` },
                    { key: 'PENDING',  label: `Pendentes (${compCounts.PENDING})` },
                    { key: 'APPROVED', label: `Aprovados (${compCounts.APPROVED})` },
                    { key: 'REJECTED', label: `Reprovados (${compCounts.REJECTED})` },
                  ] as const).map(f => (
                    <button key={f.key} onClick={() => setCompFilter(f.key)}
                      style={{ padding: '6px 12px', borderRadius: 8, border: compFilter === f.key ? '1px solid #23A455' : '1px solid #e5e7eb', background: compFilter === f.key ? '#e8f9eb' : 'white', color: compFilter === f.key ? '#23A455' : '#6b7280', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Filtro de turma comprovantes */}
                {todasTurmasComp.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: '#6b8f72', fontWeight: 600 }}>Turma:</span>
                    <button onClick={() => setCompFilterTurma('')}
                      style={{ padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: !compFilterTurma ? '1px solid #23A455' : '1px solid #e5e7eb', background: !compFilterTurma ? '#e8f9eb' : 'white', color: !compFilterTurma ? '#23A455' : '#6b7280' }}>
                      Todas
                    </button>
                    {todasTurmasComp.map(t => (
                      <button key={t} onClick={() => setCompFilterTurma(t === compFilterTurma ? '' : t)}
                        style={{ padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: compFilterTurma === t ? '1px solid #23A455' : '1px solid #e5e7eb', background: compFilterTurma === t ? '#e8f9eb' : 'white', color: compFilterTurma === t ? '#23A455' : '#6b7280' }}>
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {loadingComp ? <LoadingSpinner /> : comprovantes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', background: 'white', borderRadius: 20, border: '1.5px dashed rgba(97,206,112,0.3)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
                <p style={{ fontWeight: 600, color: '#3d5c42', fontSize: 16 }}>Nenhum comprovante enviado</p>
                <p style={{ color: '#6b8f72', fontSize: 14, marginTop: 6 }}>Os comprovantes aparecem aqui quando os pais os enviarem.</p>
              </div>
            ) : filteredComps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 24px', background: 'white', borderRadius: 16 }}>
                <p style={{ fontWeight: 600, color: '#6b7280' }}>Nenhum resultado encontrado.</p>
                <button onClick={() => { setCompSearch(''); setCompFilter('all') }}
                  style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: '#23A455', background: '#e8f9eb', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>
                  Limpar filtros
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredComps.map(b => {
                  const isOpen     = expandedComp === b.id
                  const isDeleting = deletingComp === b.id
                  const isBusy     = actingComp === b.id
                  const isNormal   = b.recoverySchedule?.type === 'normal'
                  const subjectsList = b.subjects ? b.subjects.split(',').map(x => x.trim()).filter(Boolean) : []

                  return (
                    <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: isDeleting ? 0.4 : 1, y: 0 }} layout
                      style={{ background: 'white', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', transition: 'opacity 0.2s' }}>
                      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: isNormal ? '#fff7ed' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 18 }}>{isNormal ? '💰' : '✅'}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#0a1a0d' }}>{b.parentName}</span>
                            <StatusBadge status={b.status} />
                            {isNormal && <span style={{ fontSize: 11, fontWeight: 600, color: '#c2410c', background: '#fff7ed', padding: '2px 8px', borderRadius: 5 }}>💰 Normal</span>}
                            {b.fileUrl && <span style={{ fontSize: 11, fontWeight: 600, color: '#4054B2', background: '#eef1fb', padding: '2px 8px', borderRadius: 5, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Paperclip style={{ width: 10, height: 10 }} />Comprovante</span>}
                          </div>
                          <p style={{ fontSize: 12, color: '#6b7280', margin: '3px 0 0' }}>
                            Aluno: <strong style={{ color: '#374151' }}>{b.studentName}</strong>
                            <span style={{ color: '#d1d5db', margin: '0 6px' }}>·</span>
                            {b.recoverySchedule?.subjectName} — {b.recoverySchedule?.grade}
                            <span style={{ color: '#d1d5db', margin: '0 6px' }}>·</span>
                            {formatDateShort(b.recoverySchedule?.date)}
                          </p>
                          {subjectsList.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                              {subjectsList.map(s => <span key={s} style={{ fontSize: 11, fontWeight: 600, color: '#23A455', background: '#e8f9eb', padding: '2px 8px', borderRadius: 5 }}>{s}</span>)}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <button onClick={e => { e.stopPropagation(); setDeleteTarget({ id: b.id, name: b.parentName }) }} disabled={isDeleting}
                            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444', cursor: isDeleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trash2 style={{ width: 14, height: 14 }} />
                          </button>
                          <button onClick={() => setExpandedComp(isOpen ? null : b.id)}
                            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e7eb', background: isOpen ? '#f3f4f6' : 'white', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronDown style={{ width: 14, height: 14 }} />
                            </motion.div>
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                            <div style={{ borderTop: '1px solid #f3f4f6', padding: '16px 18px', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 12 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                  <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px' }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: '#23A455', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>Prova</p>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0a1a0d', margin: 0 }}>{b.recoverySchedule?.subjectName}</p>
                                    <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>{b.recoverySchedule?.grade}</p>
                                    <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0', textTransform: 'capitalize' }}>{formatDate(b.recoverySchedule?.date)}</p>
                                    <p style={{ fontSize: 13, color: '#23A455', fontWeight: 600, margin: '4px 0 0' }}>{b.recoverySchedule?.startTime} – {b.recoverySchedule?.endTime}</p>
                                  </div>
                                  <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px' }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>Contato</p>
                                    <p style={{ fontSize: 12, color: '#374151', margin: 0 }}>📧 {b.parentEmail}</p>
                                    <p style={{ fontSize: 12, color: '#374151', margin: '3px 0 0' }}>📱 {b.parentPhone}</p>
                                    <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>Enviado: {formatDateTime(b.createdAt)}</p>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                  {isNormal && (
                                    <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '12px 14px' }}>
                                      <p style={{ fontSize: 11, fontWeight: 700, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>💰 PIX — R$ 30,00</p>
                                      <p style={{ fontSize: 12, color: '#92400e', margin: 0 }}>Chave: <strong>{PIX_KEY}</strong></p>
                                      <p style={{ fontSize: 12, color: '#92400e', margin: '3px 0 0' }}>{PIX_NAME}</p>
                                    </div>
                                  )}
                                  <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                                      {isNormal ? '🧾 Comprovante PIX' : '📄 Comprovante'}
                                    </p>
                                    {b.fileUrl ? (
                                      <div style={{ display: 'flex', gap: 8 }}>
                                        <a href={b.fileUrl} target="_blank" rel="noopener noreferrer"
                                          style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#4054B2', textDecoration: 'none', background: '#eef1fb', padding: '9px 0', borderRadius: 8, border: '1px solid rgba(64,84,178,0.2)' }}>
                                          <ExternalLink style={{ width: 13, height: 13 }} />Visualizar
                                        </a>
                                        <a href={b.fileUrl} download target="_blank" rel="noopener noreferrer"
                                          style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#166534', textDecoration: 'none', background: '#dcfce7', padding: '9px 0', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                                          <Download style={{ width: 13, height: 13 }} />Baixar
                                        </a>
                                      </div>
                                    ) : (
                                      <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Paperclip style={{ width: 13, height: 13 }} />Nenhum arquivo enviado
                                      </p>
                                    )}
                                    <div style={{ display: 'flex', gap: 8 }}>
                                      {b.status !== 'APPROVED' && (
                                        <button onClick={() => handleApproveComp(b.id)} disabled={isBusy}
                                          style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'white', background: isBusy ? '#86efac' : '#22c55e', border: 'none', padding: '8px 0', borderRadius: 8, cursor: isBusy ? 'not-allowed' : 'pointer' }}>
                                          <CheckCircle style={{ width: 12, height: 12 }} />{isBusy ? '...' : 'Aprovar'}
                                        </button>
                                      )}
                                      {b.status !== 'REJECTED' && (
                                        <button onClick={() => setRejectTargetComp({ id: b.id, studentName: b.studentName })} disabled={isBusy}
                                          style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'white', background: isBusy ? '#fca5a5' : '#ef4444', border: 'none', padding: '8px 0', borderRadius: 8, cursor: isBusy ? 'not-allowed' : 'pointer' }}>
                                          <XCircle style={{ width: 12, height: 12 }} />{isBusy ? '...' : 'Reprovar'}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
                <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 4 }}>
                  Mostrando {filteredComps.length} de {comprovantes.length} comprovante{comprovantes.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
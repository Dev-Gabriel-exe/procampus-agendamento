// app/secretaria/segunda-chamada/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast, Toaster } from 'sonner'
import Link from 'next/link'
import {
  CalendarDays, Users, LogOut, BookOpen, ClipboardList,
  Plus, Trash2, ChevronDown, AlertCircle, X, Users2,
  CheckCircle, XCircle, Paperclip, Clock, Filter,
  FolderOpen, FileText, Heart, Download, ExternalLink,
  Search, SlidersHorizontal, BookMarked,
} from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import RoleBadge from '@/components/secretaria/RoleBadge'

export const dynamic = 'force-dynamic'

const GRADES_FUND1 = ['Educação Infantil','1º Ano Fundamental','2º Ano Fundamental','3º Ano Fundamental','4º Ano Fundamental','5º Ano Fundamental']
const GRADES_FUND2 = ['6º Ano Fundamental','7º Ano Fundamental','8º Ano Fundamental','9º Ano Fundamental','1ª Série Médio','2ª Série Médio','3ª Série Médio']
const GRADES_ALL   = [...GRADES_FUND1, ...GRADES_FUND2]

const NAV_ITEMS = [
  { href: '/secretaria',                 icon: CalendarDays,  label: 'Agendamentos',    key: 'dashboard' },
  { href: '/secretaria/professores',     icon: Users,         label: 'Professores',     key: 'professores' },
  { href: '/secretaria/disciplinas',     icon: BookOpen,      label: 'Disciplinas',     key: 'disciplinas' },
  { href: '/secretaria/segunda-chamada', icon: ClipboardList, label: 'Segunda Chamada', key: 'segunda-chamada' },
  { href: '/secretaria/recuperacao', icon: BookMarked, label: 'Recuperação', key: 'recuperacao' },
]

type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
type ActiveTab     = 'slots' | 'comprovantes'
type CompFilter    = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED'

type ExamBooking = {
  id: string
  studentName: string
  parentName: string
  parentEmail: string
  parentPhone: string
  createdAt: string
  justified?: boolean | null
  reason?: string | null
  lutoText?: string | null
  fileUrl?: string | null
  status?: BookingStatus
}

type Subject      = { id: string; name: string; grade: string }
type ExamSchedule = { id: string; subjectName: string; grade: string; date: string; startTime: string; endTime: string; active: boolean; bookings: ExamBooking[] }

type ComprovanteBooking = ExamBooking & {
  examSchedule: {
    subjectName: string
    grade: string
    date: string
    startTime: string
    endTime: string
  }
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

function computeJustified(b: ExamBooking) {
  if (b.justified !== null && b.justified !== undefined) return b.justified
  return !!(b.reason || b.lutoText || b.fileUrl)
}

const STATUS_META: Record<BookingStatus, { label: string; bg: string; color: string; border: string; icon: React.ReactNode }> = {
  PENDING:  { label: 'Pendente',  bg: '#fef3c7', color: '#b45309', border: '#fde68a', icon: <Clock      style={{ width: 10, height: 10 }} /> },
  APPROVED: { label: 'Aprovado',  bg: '#dcfce7', color: '#166534', border: '#bbf7d0', icon: <CheckCircle style={{ width: 10, height: 10 }} /> },
  REJECTED: { label: 'Reprovado', bg: '#fee2e2', color: '#991b1b', border: '#fecaca', icon: <XCircle    style={{ width: 10, height: 10 }} /> },
}

function StatusBadge({ status }: { status?: BookingStatus }) {
  const s = STATUS_META[status ?? 'PENDING']
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, padding: '3px 9px', borderRadius: 6, whiteSpace: 'nowrap', border: `1px solid ${s.border}` }}>
      {s.icon}{s.label}
    </span>
  )
}

const STATUS_ORDER: Record<BookingStatus, number> = { PENDING: 0, APPROVED: 1, REJECTED: 2 }
function sortBookings(bookings: ExamBooking[]) {
  return [...bookings].sort((a, b) => {
    const sd = STATUS_ORDER[a.status ?? 'PENDING'] - STATUS_ORDER[b.status ?? 'PENDING']
    if (sd !== 0) return sd
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
}

function reasonLabel(reason?: string | null) {
  if (reason === 'doenca') return '🩺 Doença'
  if (reason === 'luto')   return '🕊️ Luto'
  return null
}

// ── Modal de confirmação de deleção ──────────────────────────────────────────
function DeleteModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ position: 'relative', background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Trash2 style={{ width: 22, height: 22, color: '#ef4444' }} />
        </div>
        <h3 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 800, fontSize: 17, color: '#0a1a0d', margin: '0 0 8px' }}>Apagar comprovante?</h3>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 22px', lineHeight: 1.5 }}>
          O registro de <strong style={{ color: '#374151' }}>{name}</strong> será removido permanentemente. Esta ação não pode ser desfeita.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: 'white', color: '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={onConfirm} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: '#ef4444', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 14px rgba(239,68,68,0.3)' }}>
            <Trash2 style={{ width: 14, height: 14 }} />Apagar
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Modal de reprovação ──────────────────────────────────────────────────────
function RejectModal({ studentName, onConfirm, onCancel }: { studentName: string; onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('')
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ position: 'relative', background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <XCircle style={{ width: 26, height: 26, color: '#ef4444' }} />
        </div>
        <h3 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 800, fontSize: 18, color: '#0a1a0d', margin: '0 0 6px' }}>Reprovar inscrição</h3>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>
          Aluno: <strong style={{ color: '#374151' }}>{studentName}</strong><br />
          Um e-mail de reprovação será enviado automaticamente ao responsável.
        </p>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          Motivo <span style={{ fontWeight: 400, textTransform: 'none' }}>(opcional)</span>
        </label>
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Ex: documentação insuficiente, prazo expirado..."
          rows={3}
          style={{ width: '100%', borderRadius: 10, border: '1.5px solid rgba(239,68,68,0.25)', background: '#fff5f5', color: '#0a1a0d', padding: '10px 12px', fontFamily: 'inherit', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 20 }}
          onFocus={e => { e.target.style.borderColor = '#ef4444'; e.target.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.1)' }}
          onBlur={e  => { e.target.style.borderColor = 'rgba(239,68,68,0.25)'; e.target.style.boxShadow = 'none' }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.1)', background: 'white', color: '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => onConfirm(reason)}
            style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: '#ef4444', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: '"Roboto Slab",serif', boxShadow: '0 4px 14px rgba(239,68,68,0.3)' }}>
            <XCircle style={{ width: 14, height: 14 }} />Reprovar e enviar e-mail
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
export default function SegundaChamadaSecretariaPage() {
  const { data: session } = useSession()
  const role   = (session?.user as any)?.role ?? 'geral'
  const grades = role === 'fund1' ? GRADES_FUND1 : role === 'fund2' ? GRADES_FUND2 : GRADES_ALL

  const [activeTab, setActiveTab] = useState<ActiveTab>('slots')

  // Slots
  const [exams,    setExams]    = useState<ExamSchedule[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [acting,   setActing]   = useState<string | null>(null)
  const [filterPending, setFilterPending] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<{ id: string; studentName: string } | null>(null)

  // Formulário
  const [selGrade,   setSelGrade]   = useState('')
  const [selSubject, setSelSubject] = useState('')
  const [examDate,   setExamDate]   = useState('')
  const [startTime,  setStartTime]  = useState('')
  const [endTime,    setEndTime]    = useState('')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  // Comprovantes
  const [comprovantes,        setComprovantes]        = useState<ComprovanteBooking[]>([])
  const [loadingComprovantes, setLoadingComprovantes] = useState(false)
  const [expandedComp,        setExpandedComp]        = useState<string | null>(null)
  const [deleteTarget,        setDeleteTarget]        = useState<{ id: string; name: string } | null>(null)
  const [deletingComp,        setDeletingComp]        = useState<string | null>(null)
  const [compSearch,          setCompSearch]          = useState('')
  const [compFilter,          setCompFilter]          = useState<CompFilter>('all')

  const availableSubjects = subjects.filter(s => s.grade === selGrade)

  // ── Loaders ───────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [eRes, sRes] = await Promise.all([
        fetch('/api/segunda-chamada'),
        fetch('/api/disciplinas'),
      ])
      if (!eRes.ok || !sRes.ok) throw new Error()
      setExams(await eRes.json())
      setSubjects(await sRes.json())
    } catch { toast.error('Falha ao carregar dados.') }
    finally   { setLoading(false) }
  }, [])

  const loadComprovantes = useCallback(async () => {
    setLoadingComprovantes(true)
    try {
      const res = await fetch('/api/segunda-chamada/comprovantes')
      if (!res.ok) throw new Error()
      setComprovantes(await res.json())
    } catch { toast.error('Falha ao carregar comprovantes.') }
    finally   { setLoadingComprovantes(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { setSelSubject('') }, [selGrade])
  useEffect(() => { if (activeTab === 'comprovantes') loadComprovantes() }, [activeTab, loadComprovantes])

  // ── Otimismo ──────────────────────────────────────────────────────────────
  function updateBookingLocally(id: string, patch: Partial<ExamBooking>) {
    setExams(prev => prev.map(e => ({ ...e, bookings: e.bookings.map(b => b.id === id ? { ...b, ...patch } : b) })))
  }
  function removeBookingLocally(id: string) {
    setExams(prev => prev.map(e => ({ ...e, bookings: e.bookings.filter(b => b.id !== id) })))
  }

  // ── Handlers: slots ───────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!selSubject || !selGrade || !examDate || !startTime || !endTime) { setError('Preencha todos os campos.'); return }
    if (startTime >= endTime) { setError('O horário de fim deve ser após o início.'); return }
    const subject = subjects.find(s => s.id === selSubject)
    if (!subject) { setError('Disciplina inválida.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/segunda-chamada', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: selSubject, subjectName: subject.name, grade: selGrade, date: examDate, startTime, endTime }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao criar'); return }
      setExamDate(''); setStartTime(''); setEndTime('')
      toast.success('Slot criado com sucesso!'); loadData()
    } catch { setError('Erro de conexão') }
    finally   { setSaving(false) }
  }

  async function handleDeleteSlot(id: string) {
    if (!confirm('Remover este slot? Todas as inscrições vinculadas também serão removidas.')) return
    const res = await fetch(`/api/segunda-chamada/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Falha ao remover slot.'); return }
    toast.success('Slot removido.'); loadData()
  }

  async function handleDeleteBooking(id: string, studentName: string) {
    if (!confirm(`Remover a inscrição de ${studentName}?`)) return
    removeBookingLocally(id)
    try {
      const res = await fetch(`/api/segunda-chamada/booking/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Inscrição removida.')
    } catch { toast.error('Falha ao remover inscrição.'); loadData() }
  }

  async function handleApprove(id: string) {
    setActing(id); updateBookingLocally(id, { status: 'APPROVED' })
    try {
      const res = await fetch(`/api/segunda-chamada/booking/${id}/approve`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success('✅ Inscrição aprovada e e-mail enviado!')
    } catch { updateBookingLocally(id, { status: 'PENDING' }); toast.error('Falha ao aprovar.') }
    finally   { setActing(null) }
  }

  function openRejectModal(id: string, studentName: string) { setRejectTarget({ id, studentName }) }

  async function confirmReject(secretariaReason: string) {
    if (!rejectTarget) return
    const { id } = rejectTarget; setRejectTarget(null)
    setActing(id); updateBookingLocally(id, { status: 'REJECTED' })
    try {
      const res = await fetch(`/api/segunda-chamada/booking/${id}/reject`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretariaReason }),
      })
      if (!res.ok) throw new Error()
      toast.success('❌ Inscrição reprovada e e-mail enviado.')
    } catch { updateBookingLocally(id, { status: 'PENDING' }); toast.error('Falha ao reprovar.') }
    finally   { setActing(null) }
  }

  // ── Handlers: comprovantes ────────────────────────────────────────────────
  async function confirmDeleteComp() {
    if (!deleteTarget) return
    const { id, name } = deleteTarget; setDeleteTarget(null)
    setDeletingComp(id)
    // Remove otimista da lista
    setComprovantes(prev => prev.filter(c => c.id !== id))
    try {
      const res = await fetch(`/api/segunda-chamada/booking/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(`Comprovante de ${name} removido.`)
    } catch { toast.error('Falha ao remover.'); loadComprovantes() }
    finally   { setDeletingComp(null) }
  }

  // ── Agrupamento e contadores ──────────────────────────────────────────────
  const grouped = exams.reduce((acc, e) => {
    const key = `${e.subjectName}|${e.grade}`
    if (!acc[key]) acc[key] = { subjectName: e.subjectName, grade: e.grade, slots: [] }
    acc[key].slots.push(e); return acc
  }, {} as Record<string, { subjectName: string; grade: string; slots: ExamSchedule[] }>)

  const globalCounts = exams.reduce(
    (acc, exam) => { exam.bookings.forEach(b => { const s = b.status ?? 'PENDING'; acc[s] = (acc[s] ?? 0) + 1 }); return acc },
    { PENDING: 0, APPROVED: 0, REJECTED: 0 } as Record<BookingStatus, number>
  )

  // ── Filtro comprovantes ───────────────────────────────────────────────────
  const filteredComps = comprovantes.filter(b => {
    const matchSearch = compSearch.trim() === '' ||
      b.parentName.toLowerCase().includes(compSearch.toLowerCase()) ||
      b.studentName.toLowerCase().includes(compSearch.toLowerCase())
    const matchStatus = compFilter === 'all' || (b.status ?? 'PENDING') === compFilter
    return matchSearch && matchStatus
  })

  const compCounts = comprovantes.reduce(
    (acc, b) => { const s = b.status ?? 'PENDING'; acc[s] = (acc[s] ?? 0) + 1; return acc },
    { PENDING: 0, APPROVED: 0, REJECTED: 0 } as Record<BookingStatus, number>
  )

  // ── Styles ────────────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1.5px solid rgba(97,206,112,0.2)', fontSize: 13,
    outline: 'none', fontFamily: 'inherit', color: '#0a1a0d', background: 'white',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#6b8f72',
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7fdf8' }}>
      <Toaster position="top-right" richColors closeButton />

      {/* Modais */}
      <AnimatePresence>
        {rejectTarget && <RejectModal studentName={rejectTarget.studentName} onConfirm={confirmReject} onCancel={() => setRejectTarget(null)} />}
        {deleteTarget && <DeleteModal name={deleteTarget.name} onConfirm={confirmDeleteComp} onCancel={() => setDeleteTarget(null)} />}
      </AnimatePresence>

      {/* Header */}
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
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: item.key === 'segunda-chamada' ? 'rgba(255,255,255,0.15)' : 'transparent', color: item.key === 'segunda-chamada' ? 'white' : 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
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

        {/* Título + tabs */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 800, fontSize: 24, color: '#0a1a0d', margin: 0 }}>Segunda Chamada</h2>
          <p style={{ color: '#6b8f72', fontSize: 13, marginTop: 4 }}>Gerencie slots, analise justificativas e aprove ou reprove inscrições</p>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {([
              { key: 'slots',        label: 'Slots & Inscrições', icon: ClipboardList },
              { key: 'comprovantes', label: 'Comprovantes',        icon: FolderOpen,
                badge: comprovantes.filter(c => (c.status ?? 'PENDING') === 'PENDING').length || null },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as ActiveTab)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, background: activeTab === tab.key ? '#4054B2' : 'white', color: activeTab === tab.key ? 'white' : '#6b8f72', boxShadow: activeTab === tab.key ? '0 4px 16px rgba(64,84,178,0.25)' : '0 1px 4px rgba(0,0,0,0.06)', border: activeTab === tab.key ? 'none' : '1px solid rgba(97,206,112,0.15)', transition: 'all 0.15s', position: 'relative' }}>
                <tab.icon style={{ width: 14, height: 14 }} />{tab.label}
                {(tab as any).badge ? (
                  <span style={{ background: '#f97316', color: 'white', borderRadius: 999, fontSize: 10, fontWeight: 800, padding: '1px 6px', marginLeft: 2 }}>
                    {(tab as any).badge}
                  </span>
                ) : null}
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
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8, border: filterPending ? '1px solid #4054B2' : '1px solid rgba(64,84,178,0.2)', background: filterPending ? '#4054B2' : 'white', color: filterPending ? 'white' : '#4054B2', cursor: 'pointer', transition: 'all 0.15s' }}>
                <Filter style={{ width: 12, height: 12 }} />{filterPending ? 'Mostrando só pendentes' : 'Mostrar só pendentes'}
              </button>
            </div>
          )}
        </div>

        {/* ════════ ABA: SLOTS & INSCRIÇÕES ════════ */}
        {activeTab === 'slots' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)', gap: 24, alignItems: 'start' }}>

            {/* Formulário */}
            <div style={{ background: 'white', borderRadius: 18, border: '1.5px solid rgba(97,206,112,0.15)', padding: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.04)', position: 'sticky', top: 76 }}>
              <h3 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 700, fontSize: 16, color: '#0a1a0d', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus style={{ width: 16, height: 16, color: '#4054B2' }} />Novo Slot de Prova
              </h3>
              <p style={{ fontSize: 12, color: '#6b8f72', marginBottom: 18 }}>Crie quantos slots quiser para a mesma disciplina</p>
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                <div>
                  <label style={labelStyle}>Data da prova</label>
                  <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#4054B2'; e.target.style.boxShadow = '0 0 0 3px rgba(64,84,178,0.1)' }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.boxShadow = 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[['Início', startTime, setStartTime], ['Fim', endTime, setEndTime]].map(([lbl, val, setter]) => (
                    <div key={lbl as string}>
                      <label style={labelStyle}>{lbl as string}</label>
                      <input type="time" value={val as string} onChange={e => (setter as any)(e.target.value)} style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = '#4054B2'; e.target.style.boxShadow = '0 0 0 3px rgba(64,84,178,0.1)' }}
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
                <button type="submit" disabled={saving} style={{ padding: '12px', borderRadius: 10, border: 'none', background: saving ? 'rgba(64,84,178,0.2)' : 'linear-gradient(135deg,#4054B2,#6b7fe8)', color: saving ? 'rgba(255,255,255,0.5)' : 'white', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: '"Roboto Slab",serif', boxShadow: saving ? 'none' : '0 4px 16px rgba(64,84,178,0.3)' }}>
                  {saving ? 'Salvando...' : <><Plus style={{ width: 15, height: 15 }} />Adicionar Slot</>}
                </button>
              </form>
            </div>

            {/* Lista agrupada */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loading ? <LoadingSpinner /> : Object.keys(grouped).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', background: 'white', borderRadius: 20, border: '1.5px dashed rgba(97,206,112,0.3)' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                  <p style={{ fontWeight: 600, color: '#3d5c42', fontSize: 16 }}>Nenhum slot cadastrado</p>
                  <p style={{ color: '#6b8f72', fontSize: 14, marginTop: 6 }}>Use o formulário ao lado para adicionar slots de prova.</p>
                </div>
              ) : Object.entries(grouped).map(([key, group]) => {
                const slotBookings = group.slots.flatMap(s => s.bookings)
                const pendingCount = slotBookings.filter(b => (b.status ?? 'PENDING') === 'PENDING').length
                if (filterPending && pendingCount === 0) return null

                return (
                  <motion.div key={key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'white', borderRadius: 16, border: '1.5px solid rgba(64,84,178,0.15)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                    <button onClick={() => setExpanded(expanded === key ? null : key)}
                      style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#4054B2,#6b7fe8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <ClipboardList style={{ width: 18, height: 18, color: 'white' }} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 15, color: '#0a1a0d', margin: 0 }}>{group.subjectName}</p>
                          <p style={{ fontSize: 12, color: '#6b8f72', margin: 0, marginTop: 2 }}>{group.grade}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#4054B2', background: '#eef1fb', borderRadius: 999, padding: '4px 10px' }}>{group.slots.length} slot{group.slots.length !== 1 ? 's' : ''}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#23A455', background: '#e8f9eb', borderRadius: 999, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Users2 style={{ width: 12, height: 12 }} />{slotBookings.length} inscrito{slotBookings.length !== 1 ? 's' : ''}
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
                          <div style={{ borderTop: '1px solid rgba(64,84,178,0.1)', padding: '16px 20px', background: '#fafafe', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {group.slots.map(slot => {
                              const visibleBookings = filterPending ? slot.bookings.filter(b => (b.status ?? 'PENDING') === 'PENDING') : slot.bookings
                              return (
                                <div key={slot.id} style={{ background: 'white', borderRadius: 12, border: '1px solid rgba(64,84,178,0.12)', overflow: 'hidden' }}>
                                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#f7f9fe' }}>
                                    <div>
                                      <p style={{ fontWeight: 700, fontSize: 14, color: '#0a1a0d', margin: 0, textTransform: 'capitalize' }}>{formatDate(slot.date)}</p>
                                      <p style={{ fontSize: 13, color: '#4054B2', fontWeight: 600, margin: 0, marginTop: 2 }}>{slot.startTime} – {slot.endTime}</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                      <span style={{ fontSize: 12, color: '#23A455', background: '#e8f9eb', borderRadius: 999, padding: '3px 10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Users2 style={{ width: 11, height: 11 }} />{slot.bookings.length}
                                      </span>
                                      <button onClick={() => handleDeleteSlot(slot.id)} style={{ padding: 6, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 8, color: '#ef4444' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <Trash2 style={{ width: 14, height: 14 }} />
                                      </button>
                                    </div>
                                  </div>

                                  {visibleBookings.length > 0 && (
                                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                      <p style={{ fontSize: 11, fontWeight: 700, color: '#4054B2', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>Inscritos — análise de justificativas</p>
                                      {sortBookings(visibleBookings).map((b, i) => {
                                        const isJustified = computeJustified(b)
                                        const isBusy = acting === b.id
                                        return (
                                          <div key={b.id} style={{ borderRadius: 10, border: isJustified ? '1.5px solid #86efac' : '1.5px solid #fca5a5', background: isJustified ? '#f0fdf4' : '#fff5f5', overflow: 'hidden' }}>
                                            <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                                              <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0a1a0d' }}>{b.studentName}</span>
                                                  <span style={{ fontSize: 10, color: '#9ca3af' }}>#{i + 1}</span>
                                                  <StatusBadge status={b.status} />
                                                  {isJustified
                                                    ? <span style={{ fontSize: 11, color: '#166534', background: '#dcfce7', padding: '2px 7px', borderRadius: 5, fontWeight: 600 }}>✔ Justificado</span>
                                                    : <span style={{ fontSize: 11, color: '#991b1b', background: '#fee2e2', padding: '2px 7px', borderRadius: 5, fontWeight: 600 }}>✘ Não justificado</span>
                                                  }
                                                </div>
                                                <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>
                                                  Resp: <strong style={{ color: '#374151' }}>{b.parentName}</strong> · {b.parentEmail} · {b.parentPhone}
                                                </p>
                                                <p style={{ fontSize: 11, color: '#9ca3af', margin: '3px 0 0' }}>Enviado em: {formatDateTime(b.createdAt)}</p>
                                              </div>
                                              <button onClick={() => handleDeleteBooking(b.id, b.studentName)}
                                                style={{ padding: 5, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 7, color: '#ef4444', flexShrink: 0, marginTop: 2 }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <Trash2 style={{ width: 13, height: 13 }} />
                                              </button>
                                            </div>
                                            {(b.reason || b.lutoText) && (
                                              <div style={{ padding: '8px 14px', borderTop: `1px solid ${isJustified ? '#bbf7d0' : '#fecaca'}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {b.reason && <p style={{ fontSize: 12, color: '#374151', margin: 0 }}><span style={{ fontWeight: 600, color: '#6b7280' }}>Motivo: </span>{reasonLabel(b.reason)}</p>}
                                                {b.lutoText && <p style={{ fontSize: 12, color: '#374151', margin: 0 }}><span style={{ fontWeight: 600, color: '#6b7280' }}>Obs: </span>{b.lutoText}</p>}
                                              </div>
                                            )}
                                            <div style={{ padding: '8px 14px', borderTop: `1px solid ${isJustified ? '#bbf7d0' : '#fecaca'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                              {b.fileUrl
                                                ? <a href={b.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#4054B2', textDecoration: 'none', background: '#eef1fb', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(64,84,178,0.2)' }}>
                                                    <Paperclip style={{ width: 11, height: 11 }} />Ver comprovante
                                                  </a>
                                                : <span style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}><Paperclip style={{ width: 11, height: 11 }} />Sem comprovante</span>
                                              }
                                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {b.status !== 'APPROVED' && (
                                                  <button onClick={() => handleApprove(b.id)} disabled={isBusy}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'white', background: isBusy ? '#86efac' : '#22c55e', border: 'none', padding: '6px 14px', borderRadius: 7, cursor: isBusy ? 'not-allowed' : 'pointer', opacity: isBusy ? 0.7 : 1 }}>
                                                    <CheckCircle style={{ width: 12, height: 12 }} />{isBusy ? '...' : 'Aprovar'}
                                                  </button>
                                                )}
                                                {b.status !== 'REJECTED' && (
                                                  <button onClick={() => openRejectModal(b.id, b.studentName)} disabled={isBusy}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'white', background: isBusy ? '#fca5a5' : '#ef4444', border: 'none', padding: '6px 14px', borderRadius: 7, cursor: isBusy ? 'not-allowed' : 'pointer', opacity: isBusy ? 0.7 : 1 }}>
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
                                  {visibleBookings.length === 0 && (
                                    <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                                      {filterPending && slot.bookings.length > 0 ? 'Nenhum inscrito pendente neste slot.' : 'Nenhum inscrito neste slot.'}
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

              {!loading && filterPending && Object.values(grouped).every(g => g.slots.flatMap(s => s.bookings).filter(b => (b.status ?? 'PENDING') === 'PENDING').length === 0) && Object.keys(grouped).length > 0 && (
                <div style={{ textAlign: 'center', padding: '40px 24px', background: 'white', borderRadius: 20, border: '1.5px dashed rgba(97,206,112,0.3)' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
                  <p style={{ fontWeight: 600, color: '#3d5c42', fontSize: 16 }}>Nenhuma inscrição pendente!</p>
                  <p style={{ color: '#6b8f72', fontSize: 13, marginTop: 4 }}>Todas as inscrições já foram analisadas.</p>
                  <button onClick={() => setFilterPending(false)} style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: '#4054B2', background: '#eef1fb', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>
                    Ver todas as inscrições
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════ ABA: COMPROVANTES ════════ */}
        {activeTab === 'comprovantes' && (
          <div>
            {/* ── Barra de busca e filtros ── */}
            {!loadingComprovantes && comprovantes.length > 0 && (
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid rgba(97,206,112,0.15)', padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                {/* Busca */}
                <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                  <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#9ca3af', pointerEvents: 'none' }} />
                  <input
                    value={compSearch} onChange={e => setCompSearch(e.target.value)}
                    placeholder="Buscar por responsável ou aluno..."
                    style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 10, border: '1.5px solid rgba(97,206,112,0.2)', fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#0a1a0d', background: '#f9fafb', boxSizing: 'border-box' }}
                    onFocus={e => { e.target.style.borderColor = '#4054B2'; e.target.style.background = 'white' }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.background = '#f9fafb' }}
                  />
                  {compSearch && (
                    <button onClick={() => setCompSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}>
                      <X style={{ width: 13, height: 13 }} />
                    </button>
                  )}
                </div>

                {/* Filtros de status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <SlidersHorizontal style={{ width: 13, height: 13, color: '#9ca3af' }} />
                  {([
                    { key: 'all',      label: `Todos (${comprovantes.length})` },
                    { key: 'PENDING',  label: `Pendentes (${compCounts.PENDING})` },
                    { key: 'APPROVED', label: `Aprovados (${compCounts.APPROVED})` },
                    { key: 'REJECTED', label: `Reprovados (${compCounts.REJECTED})` },
                  ] as const).map(f => (
                    <button key={f.key} onClick={() => setCompFilter(f.key)}
                      style={{ padding: '6px 12px', borderRadius: 8, border: compFilter === f.key ? '1px solid #4054B2' : '1px solid #e5e7eb', background: compFilter === f.key ? '#eef1fb' : 'white', color: compFilter === f.key ? '#4054B2' : '#6b7280', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.12s' }}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loadingComprovantes ? (
              <LoadingSpinner />
            ) : comprovantes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', background: 'white', borderRadius: 20, border: '1.5px dashed rgba(97,206,112,0.3)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
                <p style={{ fontWeight: 600, color: '#3d5c42', fontSize: 16 }}>Nenhum comprovante enviado</p>
                <p style={{ color: '#6b8f72', fontSize: 14, marginTop: 6 }}>Os comprovantes aparecem aqui quando os pais os enviarem.</p>
              </div>
            ) : filteredComps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 24px', background: 'white', borderRadius: 16, border: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
                <p style={{ fontWeight: 600, color: '#6b7280', fontSize: 15 }}>Nenhum resultado encontrado</p>
                <button onClick={() => { setCompSearch(''); setCompFilter('all') }}
                  style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: '#4054B2', background: '#eef1fb', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>
                  Limpar filtros
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredComps.map(b => {
                  const isOpen      = expandedComp === b.id
                  const isJustified = computeJustified(b)
                  const rlabel      = reasonLabel(b.reason)
                  const isDeleting  = deletingComp === b.id

                  // Cores por tipo de justificativa
                  const typeColor = b.reason === 'doenca' ? { bg: '#eff6ff', color: '#1d4ed8', icon: <FileText style={{ width: 16, height: 16, color: '#3b82f6' }} /> }
                                  : b.reason === 'luto'   ? { bg: '#f5f3ff', color: '#7c3aed', icon: <Heart    style={{ width: 16, height: 16, color: '#8b5cf6' }} /> }
                                  : { bg: '#fff7ed', color: '#c2410c', icon: <FolderOpen style={{ width: 16, height: 16, color: '#f97316' }} /> }

                  return (
                    <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: isDeleting ? 0.4 : 1, y: 0 }} layout
                      style={{ background: 'white', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', transition: 'opacity 0.2s' }}>

                      {/* Linha principal — sempre visível */}
                      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>

                        {/* Ícone de tipo */}
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: typeColor.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {typeColor.icon}
                        </div>

                        {/* Info principal */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#0a1a0d' }}>{b.parentName}</span>
                            <StatusBadge status={b.status} />
                            {rlabel && (
                              <span style={{ fontSize: 11, fontWeight: 600, color: typeColor.color, background: typeColor.bg, padding: '2px 8px', borderRadius: 5 }}>
                                {rlabel}
                              </span>
                            )}
                            {b.fileUrl && (
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#4054B2', background: '#eef1fb', padding: '2px 8px', borderRadius: 5, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Paperclip style={{ width: 10, height: 10 }} />Anexo
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: 12, color: '#6b7280', margin: '3px 0 0' }}>
                            Aluno: <strong style={{ color: '#374151' }}>{b.studentName}</strong>
                            <span style={{ color: '#d1d5db', margin: '0 6px' }}>·</span>
                            {b.examSchedule.subjectName} — {b.examSchedule.grade}
                            <span style={{ color: '#d1d5db', margin: '0 6px' }}>·</span>
                            {formatDateShort(b.examSchedule.date)}
                          </p>
                        </div>

                        {/* Ações sempre visíveis */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          {/* Lixeira */}
                          <button
                            onClick={e => { e.stopPropagation(); setDeleteTarget({ id: b.id, name: b.parentName }) }}
                            disabled={isDeleting}
                            title="Apagar comprovante"
                            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444', cursor: isDeleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}
                            onMouseEnter={e => { if (!isDeleting) { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white' } }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444' }}>
                            <Trash2 style={{ width: 14, height: 14 }} />
                          </button>

                          {/* Expandir */}
                          <button onClick={() => setExpandedComp(isOpen ? null : b.id)}
                            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e5e7eb', background: isOpen ? '#f3f4f6' : 'white', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                            <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronDown style={{ width: 14, height: 14 }} />
                            </motion.div>
                          </button>
                        </div>
                      </div>

                      {/* Painel expandido */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                            <div style={{ borderTop: '1px solid #f3f4f6', padding: '16px 18px', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 12 }}>

                              {/* Duas colunas: info + arquivo */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

                                {/* Coluna 1: dados */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                  <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px' }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: '#4054B2', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>Prova</p>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0a1a0d', margin: 0 }}>{b.examSchedule.subjectName}</p>
                                    <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>{b.examSchedule.grade}</p>
                                    <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0', textTransform: 'capitalize' }}>
                                      {formatDate(b.examSchedule.date)}
                                    </p>
                                    <p style={{ fontSize: 13, color: '#4054B2', fontWeight: 600, margin: '4px 0 0' }}>
                                      {b.examSchedule.startTime} – {b.examSchedule.endTime}
                                    </p>
                                  </div>

                                  <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>Contato</p>
                                    <p style={{ fontSize: 12, color: '#374151', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <span style={{ color: '#9ca3af' }}>📧</span>{b.parentEmail}
                                    </p>
                                    <p style={{ fontSize: 12, color: '#374151', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <span style={{ color: '#9ca3af' }}>📱</span>{b.parentPhone}
                                    </p>
                                    <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>Enviado: {formatDateTime(b.createdAt)}</p>
                                  </div>
                                </div>

                                {/* Coluna 2: justificativa + arquivo */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                  {/* Texto de luto */}
                                  {b.lutoText && (
                                    <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: '12px 14px' }}>
                                      <p style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>
                                        🕊️ Descrição do ocorrido
                                      </p>
                                      <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.5 }}>{b.lutoText}</p>
                                    </div>
                                  )}

                                  {/* Arquivo */}
                                  <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                                      {b.reason === 'doenca' ? '🩺 Atestado Médico' : b.reason === 'luto' ? '📄 Documento' : '💸 Comprovante PIX'}
                                    </p>

                                    {b.fileUrl ? (
                                      <>
                                        <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Arquivo enviado pelo responsável</p>
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
                                      </>
                                    ) : (
                                      <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Paperclip style={{ width: 13, height: 13 }} />Nenhum arquivo enviado
                                      </p>
                                    )}
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

                {/* Rodapé com total */}
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
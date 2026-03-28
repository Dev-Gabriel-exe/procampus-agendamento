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
]

type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
type ActiveTab     = 'slots' | 'comprovantes'

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
function formatDateTime(date: string) {
  return new Date(date).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' })
}

// ✅ FIX: isJustified derivado dos campos reais — não do booleano do backend
function computeJustified(b: ExamBooking) {
  // Prioriza o campo do banco — só usa fallback se vier null/undefined
  if (b.justified !== null && b.justified !== undefined) return b.justified
  return !!(b.reason || b.lutoText || b.fileUrl)
}

// ── Badge de status ──────────────────────────────────────────────────────────
const STATUS_META: Record<BookingStatus, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
  PENDING:  { label: 'Pendente',  bg: '#fef3c7', color: '#b45309', icon: <Clock      style={{ width: 10, height: 10 }} /> },
  APPROVED: { label: 'Aprovado',  bg: '#dcfce7', color: '#166534', icon: <CheckCircle style={{ width: 10, height: 10 }} /> },
  REJECTED: { label: 'Reprovado', bg: '#fee2e2', color: '#991b1b', icon: <XCircle    style={{ width: 10, height: 10 }} /> },
}

function StatusBadge({ status }: { status?: BookingStatus }) {
  const s = STATUS_META[status ?? 'PENDING']
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, padding: '3px 9px', borderRadius: 6, whiteSpace: 'nowrap' }}>
      {s.icon}{s.label}
    </span>
  )
}

// Ordena: PENDING → APPROVED → REJECTED, desempate por createdAt
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
  return '—'
}

// ── Modal de reprovação ──────────────────────────────────────────────────────
function RejectModal({
  studentName,
  onConfirm,
  onCancel,
}: {
  studentName: string
  onConfirm: (reason: string) => void
  onCancel: () => void
}) {
  const [reason, setReason] = useState('')

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Backdrop */}
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ position: 'relative', background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
      >
        {/* Ícone */}
        <div style={{ width: 52, height: 52, borderRadius: 16, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <XCircle style={{ width: 26, height: 26, color: '#ef4444' }} />
        </div>

        <h3 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 800, fontSize: 18, color: '#0a1a0d', margin: '0 0 6px' }}>
          Reprovar inscrição
        </h3>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>
          Aluno: <strong style={{ color: '#374151' }}>{studentName}</strong>
          <br />
          Um e-mail de reprovação será enviado automaticamente ao responsável.
        </p>

        {/* Campo opcional de motivo */}
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          Motivo da reprovação <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(opcional)</span>
        </label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Ex: documentação insuficiente, prazo expirado..."
          rows={3}
          style={{ width: '100%', borderRadius: 10, border: '1.5px solid rgba(239,68,68,0.25)', background: '#fff5f5', color: '#0a1a0d', padding: '10px 12px', fontFamily: 'inherit', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 20 }}
          onFocus={e  => { e.target.style.borderColor = '#ef4444'; e.target.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.1)' }}
          onBlur={e   => { e.target.style.borderColor = 'rgba(239,68,68,0.25)'; e.target.style.boxShadow = 'none' }}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.1)', background: 'white', color: '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancelar
          </button>
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

  // Modal reprovação
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
    } catch {
      toast.error('Falha ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadComprovantes = useCallback(async () => {
    setLoadingComprovantes(true)
    try {
      const res = await fetch('/api/segunda-chamada/comprovantes')
      if (!res.ok) throw new Error()
      setComprovantes(await res.json())
    } catch {
      toast.error('Falha ao carregar comprovantes.')
    } finally {
      setLoadingComprovantes(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { setSelSubject('') }, [selGrade])
  useEffect(() => {
    if (activeTab === 'comprovantes') loadComprovantes()
  }, [activeTab, loadComprovantes])

  // ── Atualização otimista ──────────────────────────────────────────────────
  function updateBookingLocally(bookingId: string, patch: Partial<ExamBooking>) {
    setExams(prev =>
      prev.map(exam => ({
        ...exam,
        bookings: exam.bookings.map(b => b.id === bookingId ? { ...b, ...patch } : b),
      }))
    )
  }

  function removeBookingLocally(bookingId: string) {
    setExams(prev =>
      prev.map(exam => ({
        ...exam,
        bookings: exam.bookings.filter(b => b.id !== bookingId),
      }))
    )
  }

  // ── Handlers ─────────────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!selSubject || !selGrade || !examDate || !startTime || !endTime) {
      setError('Preencha todos os campos.'); return
    }
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
      toast.success('Slot criado com sucesso!')
      loadData()
    } catch {
      setError('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteSlot(id: string) {
    if (!confirm('Remover este slot? Todas as inscrições vinculadas também serão removidas.')) return
    const res = await fetch(`/api/segunda-chamada/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Falha ao remover slot.'); return }
    toast.success('Slot removido.')
    loadData()
  }

  // ✅ Apagar inscrição individual
  async function handleDeleteBooking(id: string, studentName: string) {
    if (!confirm(`Remover a inscrição de ${studentName}?`)) return
    removeBookingLocally(id) // otimista
    try {
      const res = await fetch(`/api/segunda-chamada/booking/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Inscrição removida.')
    } catch {
      toast.error('Falha ao remover inscrição.')
      loadData() // reverte
    }
  }

  // ✅ Aprovar → auto-envia e-mail de aprovação
  async function handleApprove(id: string) {
  setActing(id)
  updateBookingLocally(id, { status: 'APPROVED' })
  try {
    const res = await fetch(`/api/segunda-chamada/booking/${id}/approve`, { method: 'POST' })
    if (!res.ok) throw new Error()
    toast.success('✅ Inscrição aprovada e e-mail enviado!')
  } catch {
    updateBookingLocally(id, { status: 'PENDING' })
    toast.error('Falha ao aprovar. Tente novamente.')
  } finally {
    setActing(null)
  }
}

  // ✅ Abre modal → secretaria adiciona motivo opcional → reprova + envia e-mail
  function openRejectModal(id: string, studentName: string) {
    setRejectTarget({ id, studentName })
  }

  async function confirmReject(secretariaReason: string) {
  if (!rejectTarget) return
  const { id } = rejectTarget
  setRejectTarget(null)
  setActing(id)
  updateBookingLocally(id, { status: 'REJECTED' })
  try {
    const res = await fetch(`/api/segunda-chamada/booking/${id}/reject`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secretariaReason }),
    })
    if (!res.ok) throw new Error()
    toast.success('❌ Inscrição reprovada e e-mail enviado.')
  } catch {
    updateBookingLocally(id, { status: 'PENDING' })
    toast.error('Falha ao reprovar. Tente novamente.')
  } finally {
    setActing(null)
  }
}

  // ── Agrupamento e contadores ──────────────────────────────────────────────
  const grouped = exams.reduce((acc, e) => {
    const key = `${e.subjectName}|${e.grade}`
    if (!acc[key]) acc[key] = { subjectName: e.subjectName, grade: e.grade, slots: [] }
    acc[key].slots.push(e)
    return acc
  }, {} as Record<string, { subjectName: string; grade: string; slots: ExamSchedule[] }>)

  const globalCounts = exams.reduce(
    (acc, exam) => {
      exam.bookings.forEach(b => { const s = b.status ?? 'PENDING'; acc[s] = (acc[s] ?? 0) + 1 })
      return acc
    },
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

      {/* ── Modal reprovação ── */}
      <AnimatePresence>
        {rejectTarget && (
          <RejectModal
            studentName={rejectTarget.studentName}
            onConfirm={confirmReject}
            onCancel={() => setRejectTarget(null)}
          />
        )}
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

        {/* Título + tabs + contadores */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 800, fontSize: 24, color: '#0a1a0d', margin: 0 }}>Segunda Chamada</h2>
          <p style={{ color: '#6b8f72', fontSize: 13, marginTop: 4 }}>Gerencie slots, analise justificativas e aprove ou reprove inscrições</p>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {([
              { key: 'slots',        label: 'Slots & Inscrições', icon: ClipboardList },
              { key: 'comprovantes', label: 'Comprovantes',        icon: FolderOpen },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, background: activeTab === tab.key ? '#4054B2' : 'white', color: activeTab === tab.key ? 'white' : '#6b8f72', boxShadow: activeTab === tab.key ? '0 4px 16px rgba(64,84,178,0.25)' : '0 1px 4px rgba(0,0,0,0.06)', border: activeTab === tab.key ? 'none' : '1px solid rgba(97,206,112,0.15)', transition: 'all 0.15s' }}>
                <tab.icon style={{ width: 14, height: 14 }} />{tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'slots' && !loading && (globalCounts.PENDING + globalCounts.APPROVED + globalCounts.REJECTED) > 0 && (
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '5px 12px', borderRadius: 8, border: '1px solid #fde68a' }}>
                <Clock style={{ width: 12, height: 12 }} />{globalCounts.PENDING} Pendente{globalCounts.PENDING !== 1 ? 's' : ''}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#166534', background: '#dcfce7', padding: '5px 12px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                <CheckCircle style={{ width: 12, height: 12 }} />{globalCounts.APPROVED} Aprovado{globalCounts.APPROVED !== 1 ? 's' : ''}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#991b1b', background: '#fee2e2', padding: '5px 12px', borderRadius: 8, border: '1px solid #fecaca' }}>
                <XCircle style={{ width: 12, height: 12 }} />{globalCounts.REJECTED} Reprovado{globalCounts.REJECTED !== 1 ? 's' : ''}
              </span>
              <button onClick={() => setFilterPending(f => !f)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8, border: filterPending ? '1px solid #4054B2' : '1px solid rgba(64,84,178,0.2)', background: filterPending ? '#4054B2' : 'white', color: filterPending ? 'white' : '#4054B2', cursor: 'pointer', transition: 'all 0.15s' }}>
                <Filter style={{ width: 12, height: 12 }} />
                {filterPending ? 'Mostrando só pendentes' : 'Mostrar só pendentes'}
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
                    <select value={selGrade} onChange={e => setSelGrade(e.target.value)}
                      style={{ ...inputStyle, appearance: 'none', paddingRight: 32, cursor: 'pointer', color: selGrade ? '#0a1a0d' : '#9ca3af' }}>
                      <option value="">Selecione a série</option>
                      {grades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <ChevronDown style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#6b8f72', pointerEvents: 'none' }} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Disciplina</label>
                  <div style={{ position: 'relative' }}>
                    <select value={selSubject} onChange={e => setSelSubject(e.target.value)} disabled={!selGrade}
                      style={{ ...inputStyle, appearance: 'none', paddingRight: 32, cursor: selGrade ? 'pointer' : 'not-allowed', color: selSubject ? '#0a1a0d' : '#9ca3af', opacity: selGrade ? 1 : 0.5 }}>
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
                    onBlur={e  => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.boxShadow = 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Início</label>
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = '#4054B2'; e.target.style.boxShadow = '0 0 0 3px rgba(64,84,178,0.1)' }}
                      onBlur={e  => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.boxShadow = 'none' }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Fim</label>
                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = '#4054B2'; e.target.style.boxShadow = '0 0 0 3px rgba(64,84,178,0.1)' }}
                      onBlur={e  => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.boxShadow = 'none' }}
                    />
                  </div>
                </div>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13 }}>
                    <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />{error}
                    <button type="button" onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><X style={{ width: 13, height: 13 }} /></button>
                  </div>
                )}

                <button type="submit" disabled={saving}
                  style={{ padding: '12px', borderRadius: 10, border: 'none', background: saving ? 'rgba(64,84,178,0.2)' : 'linear-gradient(135deg,#4054B2,#6b7fe8)', color: saving ? 'rgba(255,255,255,0.5)' : 'white', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: '"Roboto Slab",serif', boxShadow: saving ? 'none' : '0 4px 16px rgba(64,84,178,0.3)' }}>
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

                    {/* Header disciplina */}
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
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#4054B2', background: '#eef1fb', borderRadius: 999, padding: '4px 10px' }}>
                          {group.slots.length} slot{group.slots.length !== 1 ? 's' : ''}
                        </span>
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

                    {/* Slots expandidos */}
                    <AnimatePresence>
                      {expanded === key && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                          <div style={{ borderTop: '1px solid rgba(64,84,178,0.1)', padding: '16px 20px', background: '#fafafe', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {group.slots.map(slot => {
                              const visibleBookings = filterPending
                                ? slot.bookings.filter(b => (b.status ?? 'PENDING') === 'PENDING')
                                : slot.bookings

                              return (
                                <div key={slot.id} style={{ background: 'white', borderRadius: 12, border: '1px solid rgba(64,84,178,0.12)', overflow: 'hidden' }}>

                                  {/* Linha do slot */}
                                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#f7f9fe' }}>
                                    <div>
                                      <p style={{ fontWeight: 700, fontSize: 14, color: '#0a1a0d', margin: 0, textTransform: 'capitalize' }}>{formatDate(slot.date)}</p>
                                      <p style={{ fontSize: 13, color: '#4054B2', fontWeight: 600, margin: 0, marginTop: 2 }}>{slot.startTime} – {slot.endTime}</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                      <span style={{ fontSize: 12, color: '#23A455', background: '#e8f9eb', borderRadius: 999, padding: '3px 10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Users2 style={{ width: 11, height: 11 }} />{slot.bookings.length}
                                      </span>
                                      {/* ✅ Apagar slot */}
                                      <button onClick={() => handleDeleteSlot(slot.id)} title="Remover slot"
                                        style={{ padding: 6, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 8, color: '#ef4444' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <Trash2 style={{ width: 14, height: 14 }} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Inscritos */}
                                  {visibleBookings.length > 0 && (
                                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                      <p style={{ fontSize: 11, fontWeight: 700, color: '#4054B2', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                                        Inscritos — análise de justificativas
                                      </p>

                                      {sortBookings(visibleBookings).map((b, i) => {
                                        const isJustified = computeJustified(b)
                                        const isBusy = acting === b.id

                                        return (
                                          <div key={b.id} style={{
                                            borderRadius: 10,
                                            // ✅ FIX: vermelho = sem justificativa, verde = com justificativa
                                            border: isJustified ? '1.5px solid #86efac' : '1.5px solid #fca5a5',
                                            background: isJustified ? '#f0fdf4' : '#fff5f5',
                                            overflow: 'hidden',
                                          }}>

                                            {/* Cabeçalho do card */}
                                            <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                                              <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0a1a0d' }}>{b.studentName}</span>
                                                  <span style={{ fontSize: 10, color: '#9ca3af' }}>#{i + 1}</span>
                                                  <StatusBadge status={b.status} />
                                                  {/* ✅ FIX: badge correto por estado */}
                                                  {isJustified
                                                    ? <span style={{ fontSize: 11, color: '#166534', background: '#dcfce7', padding: '2px 7px', borderRadius: 5, fontWeight: 600 }}>✔ Justificado</span>
                                                    : <span style={{ fontSize: 11, color: '#991b1b', background: '#fee2e2', padding: '2px 7px', borderRadius: 5, fontWeight: 600 }}>✘ Não justificado</span>
                                                  }
                                                </div>
                                                <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>
                                                  Resp: <strong style={{ color: '#374151' }}>{b.parentName}</strong> · {b.parentEmail} · {b.parentPhone}
                                                </p>
                                                <p style={{ fontSize: 11, color: '#9ca3af', margin: '3px 0 0' }}>
                                                  Enviado em: {formatDateTime(b.createdAt)}
                                                </p>
                                              </div>

                                              {/* ✅ Apagar inscrição */}
                                              <button onClick={() => handleDeleteBooking(b.id, b.studentName)} title="Remover inscrição"
                                                style={{ padding: 5, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 7, color: '#ef4444', flexShrink: 0, marginTop: 2 }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <Trash2 style={{ width: 13, height: 13 }} />
                                              </button>
                                            </div>

                                            {/* Motivo + obs */}
                                            {(b.reason || b.lutoText) && (
                                              <div style={{ padding: '8px 14px', borderTop: `1px solid ${isJustified ? '#bbf7d0' : '#fecaca'}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {b.reason && (
                                                  <p style={{ fontSize: 12, color: '#374151', margin: 0 }}>
                                                    <span style={{ fontWeight: 600, color: '#6b7280' }}>Motivo: </span>{reasonLabel(b.reason)}
                                                  </p>
                                                )}
                                                {b.lutoText && (
                                                  <p style={{ fontSize: 12, color: '#374151', margin: 0 }}>
                                                    <span style={{ fontWeight: 600, color: '#6b7280' }}>Obs: </span>{b.lutoText}
                                                  </p>
                                                )}
                                              </div>
                                            )}

                                            {/* Comprovante + ações */}
                                            <div style={{ padding: '8px 14px', borderTop: `1px solid ${isJustified ? '#bbf7d0' : '#fecaca'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                              {b.fileUrl
                                                ? <a href={b.fileUrl} target="_blank" rel="noopener noreferrer"
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#4054B2', textDecoration: 'none', background: '#eef1fb', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(64,84,178,0.2)' }}>
                                                    <Paperclip style={{ width: 11, height: 11 }} />Ver comprovante
                                                  </a>
                                                : <span style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Paperclip style={{ width: 11, height: 11 }} />Sem comprovante
                                                  </span>
                                              }

                                              {/* ✅ Só Aprovar e Reprovar — e-mail é automático */}
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
            {loadingComprovantes ? (
              <LoadingSpinner />
            ) : comprovantes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', background: 'white', borderRadius: 20, border: '1.5px dashed rgba(97,206,112,0.3)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
                <p style={{ fontWeight: 600, color: '#3d5c42', fontSize: 16 }}>Nenhum comprovante enviado</p>
                <p style={{ color: '#6b8f72', fontSize: 14, marginTop: 6 }}>Os comprovantes aparecem aqui quando os pais os enviarem.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
                {comprovantes.map(b => {
                  const isOpen      = expandedComp === b.id
                  const isJustified = computeJustified(b)

                  return (
                    <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      style={{ background: 'white', borderRadius: 16, border: `1.5px solid ${isJustified ? 'rgba(134,239,172,0.5)' : 'rgba(252,165,165,0.5)'}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>

                      <button onClick={() => setExpandedComp(isOpen ? null : b.id)}
                        style={{ width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: b.reason === 'doenca' ? '#eff6ff' : b.reason === 'luto' ? '#f5f3ff' : '#fff7ed' }}>
                            {b.reason === 'doenca'
                              ? <FileText   style={{ width: 17, height: 17, color: '#3b82f6' }} />
                              : b.reason === 'luto'
                              ? <Heart      style={{ width: 17, height: 17, color: '#8b5cf6' }} />
                              : <FolderOpen style={{ width: 17, height: 17, color: '#f97316' }} />
                            }
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: 14, color: '#0a1a0d', margin: 0 }}>{b.parentName}</p>
                            <p style={{ fontSize: 12, color: '#6b7280', margin: 0, marginTop: 2 }}>Aluno: {b.studentName}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <StatusBadge status={b.status} />
                          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown style={{ width: 14, height: 14, color: '#9ca3af' }} />
                          </motion.div>
                        </div>
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                            <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #f3f4f6' }}>
                              <div style={{ background: '#f7f9fe', borderRadius: 10, padding: '10px 14px', marginTop: 10 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: '#4054B2', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>Prova</p>
                                <p style={{ fontSize: 13, fontWeight: 600, color: '#0a1a0d', margin: 0 }}>{b.examSchedule.subjectName} — {b.examSchedule.grade}</p>
                                <p style={{ fontSize: 12, color: '#6b7280', margin: '3px 0 0', textTransform: 'capitalize' }}>
                                  {formatDate(b.examSchedule.date)} · {b.examSchedule.startTime} – {b.examSchedule.endTime}
                                </p>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>📧 {b.parentEmail}</p>
                                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>📱 {b.parentPhone}</p>
                                <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Enviado em: {formatDateTime(b.createdAt)}</p>
                              </div>
                              {b.reason && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: b.reason === 'doenca' ? '#1d4ed8' : '#7c3aed', background: b.reason === 'doenca' ? '#eff6ff' : '#f5f3ff', padding: '3px 10px', borderRadius: 6 }}>
                                    {reasonLabel(b.reason)}
                                  </span>
                                </div>
                              )}
                              {b.lutoText && (
                                <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 8, padding: '10px 12px' }}>
                                  <p style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Descrição</p>
                                  <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>{b.lutoText}</p>
                                </div>
                              )}
                              {b.fileUrl ? (
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <a href={b.fileUrl} target="_blank" rel="noopener noreferrer"
                                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#4054B2', textDecoration: 'none', background: '#eef1fb', padding: '9px 0', borderRadius: 8, border: '1px solid rgba(64,84,178,0.2)' }}>
                                    <ExternalLink style={{ width: 12, height: 12 }} />Visualizar
                                  </a>
                                  <a href={b.fileUrl} download target="_blank" rel="noopener noreferrer"
                                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#166534', textDecoration: 'none', background: '#dcfce7', padding: '9px 0', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                                    <Download style={{ width: 12, height: 12 }} />Baixar
                                  </a>
                                </div>
                              ) : (
                                <p style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
                                  <Paperclip style={{ width: 12, height: 12 }} />Sem arquivo anexado
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  )
}
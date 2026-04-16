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
  CheckCircle, XCircle, Clock, BookMarked, FolderOpen,
  Search, SlidersHorizontal, Download, ExternalLink,
  Paperclip, Filter, Copy, FileText, Heart, Printer,
} from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import RoleBadge from '@/components/secretaria/RoleBadge'
import PrintByTurma from '@/components/secretaria/PrintByTurma'
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

type ExamBooking = {
  id: string; studentName: string; studentGrade: string; parentName: string
  parentEmail: string; parentPhone: string; subjects: string; createdAt: string
  justified?: boolean | null; reason?: string | null; lutoText?: string | null
  autorizacaoText?: string | null; fileUrl?: string | null; status?: BookingStatus
}
type ExamSchedule = {
  id: string; subjectName: string; grade: string
  date: string; startTime: string; endTime: string; active: boolean
  registrationDeadline?: string | null
  bookings: ExamBooking[]
}
type ComprovanteBooking = ExamBooking & {
  examSchedule: { subjectName: string; grade: string; date: string; startTime: string; endTime: string }
}

const STATUS_META: Record<BookingStatus, { label: string; bg: string; color: string; border: string; icon: React.ReactNode }> = {
  PENDING:  { label: 'Pendente',  bg: '#fef3c7', color: '#b45309', border: '#fde68a', icon: <Clock      style={{ width: 10, height: 10 }} /> },
  APPROVED: { label: 'Aprovado',  bg: '#dcfce7', color: '#166534', border: '#bbf7d0', icon: <CheckCircle style={{ width: 10, height: 10 }} /> },
  REJECTED: { label: 'Reprovado', bg: '#fee2e2', color: '#991b1b', border: '#fecaca', icon: <XCircle    style={{ width: 10, height: 10 }} /> },
}

const PIX_KEY  = 'financeiro@procampus.com.br'
const PIX_NAME = 'SOCIEDADE EDUCACIONAL DO PIAUI S/S LTDA'

// ── helpers ──────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: BookingStatus }) {
  const s = STATUS_META[status ?? 'PENDING']
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, padding: '3px 9px', borderRadius: 6, whiteSpace: 'nowrap', border: `1px solid ${s.border}` }}>
      {s.icon}{s.label}
    </span>
  )
}

function computeJustified(b: ExamBooking) {
  if (b.justified !== null && b.justified !== undefined) return b.justified
  return !!(b.reason || b.lutoText || b.autorizacaoText || b.fileUrl)
}

function reasonLabel(reason?: string | null) {
  if (reason === 'doenca') return '🩺 Doença'
  if (reason === 'luto')   return '🕊️ Luto'
  if (reason === 'autorizacao') return '✅ Autorizado'
  return null
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
function formatLocalInput(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
function deadlineExpired(deadline?: string | null): boolean {
  if (!deadline) return false
  const dateInFortaleza = new Date(deadline).toLocaleDateString('en-CA', { timeZone: 'America/Fortaleza' })
  const [y, m, d] = dateInFortaleza.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + 1, 3, 0, 0)) < new Date()
}

// ── Modais ────────────────────────────────────────────────────────────────────
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

// ════════════════════════════════════════════════════════════════════════════
export default function SegundaChamadaSecretariaPage() {
  const { data: session } = useSession()
  const role   = (session?.user as any)?.role ?? 'geral'
  const grades = role === 'fund1' ? GRADES_FUND1 : role === 'fund2' ? GRADES_FUND2 : GRADES_ALL

  const [activeTab,     setActiveTab]     = useState<ActiveTab>('slots')
  const [showPrintView, setShowPrintView] = useState(false)

  // Slots
  const [exams,         setExams]         = useState<ExamSchedule[]>([])
  const [subjects,      setSubjects]      = useState<Subject[]>([])
  const [loading,       setLoading]       = useState(true)
  const [expandedGrade, setExpandedGrade] = useState<string | null>(null)
  const [acting,        setActing]        = useState<string | null>(null)
  const [rejectTarget,  setRejectTarget]  = useState<{ id: string; studentName: string } | null>(null)
  const [filterPending, setFilterPending] = useState(false)
  const [slotFilterTurma, setSlotFilterTurma] = useState('')
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<string>>(new Set())

  // Delete inscrição
  const [deleteBookingTarget, setDeleteBookingTarget] = useState<{ id: string; name: string } | null>(null)
  const [deletingBooking,     setDeletingBooking]     = useState<string | null>(null)

  // Comprovantes
  const [comprovantes,     setComprovantes]     = useState<ComprovanteBooking[]>([])
  const [loadingComp,      setLoadingComp]      = useState(false)
  const [expandedComp,     setExpandedComp]     = useState<string | null>(null)
  const [deleteTarget,     setDeleteTarget]     = useState<{ id: string; name: string } | null>(null)
  const [deletingComp,     setDeletingComp]     = useState<string | null>(null)
  const [compSearch,       setCompSearch]       = useState('')
  const [compFilter,       setCompFilter]       = useState<CompFilter>('all')
  const [compFilterTurma,  setCompFilterTurma]  = useState('')

  // Formulário em lote
  const [examDate,     setExamDate]     = useState('')
  const [startTime,    setStartTime]    = useState('')
  const [endTime,      setEndTime]      = useState('')
  const [regDeadline,  setRegDeadline]  = useState('')
  const [loteSelecao,  setLoteSelecao]  = useState<Record<string, string[]>>({}) // grade → [subjectId]
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')

  const totalLote = Object.values(loteSelecao).reduce((s, ids) => s + ids.length, 0)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [eRes, sRes] = await Promise.all([fetch('/api/segunda-chamada'), fetch('/api/disciplinas')])
      if (!eRes.ok || !sRes.ok) throw new Error()
      setExams(await eRes.json())
      setSubjects(await sRes.json())
    } catch { toast.error('Falha ao carregar dados.') }
    finally { setLoading(false) }
  }, [])

  const loadComprovantes = useCallback(async () => {
    setLoadingComp(true)
    try {
      const res = await fetch('/api/segunda-chamada/comprovantes')
      if (!res.ok) throw new Error()
      setComprovantes(await res.json())
    } catch { toast.error('Falha ao carregar comprovantes.') }
    finally { setLoadingComp(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { if (activeTab === 'comprovantes') loadComprovantes() }, [activeTab, loadComprovantes])

  // ── Copiar data e horário ──────────────────────────────────────────────────
  function handleCopySlot(slot: ExamSchedule) {
    setExamDate(slot.date.split('T')[0])
    setStartTime(slot.startTime)
    setEndTime(slot.endTime)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast.info('📋 Data e horário copiados!')
  }

  // ── Mutations locais ───────────────────────────────────────────────────────
  function updateBookingLocally(id: string, patch: Partial<ExamBooking>) {
    setExams(prev => prev.map(e => ({ ...e, bookings: e.bookings.map(b => b.id === id ? { ...b, ...patch } : b) })))
  }
  function removeBookingLocally(id: string) {
    setExams(prev => prev.map(e => ({ ...e, bookings: e.bookings.filter(b => b.id !== id) })))
  }

  // ── Criar slots em lote ────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!examDate || !startTime || !endTime) { setError('Preencha a data e os horários.'); return }
    if (startTime >= endTime) { setError('Horário de fim deve ser após o início.'); return }
    if (totalLote === 0) { setError('Selecione pelo menos uma disciplina.'); return }
    if (regDeadline && regDeadline >= examDate) { setError('O prazo de inscrições deve ser anterior à data da prova.'); return }

    setSaving(true)
    let criados = 0; let erros = 0

    for (const [grade, discIds] of Object.entries(loteSelecao)) {
      if (discIds.length === 0) continue
      for (const discId of discIds) {
        const subject = subjects.find(s => s.id === discId)
        if (!subject) continue
        try {
          const res = await fetch('/api/segunda-chamada', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subjectId: discId, subjectName: subject.name, grade,
              date: examDate, startTime, endTime,
              registrationDeadline: regDeadline || null,
            }),
          })
          if (res.ok) criados++; else erros++
        } catch { erros++ }
      }
    }

    setSaving(false)
    if (criados > 0) {
      toast.success(`✅ ${criados} slot${criados !== 1 ? 's' : ''} criado${criados !== 1 ? 's' : ''}!${erros > 0 ? ` (${erros} já existiam)` : ''}`)
      setLoteSelecao({}); setExamDate(''); setStartTime(''); setEndTime(''); setRegDeadline('')
      loadData()
    } else {
      setError(`Erro: ${erros} slot${erros !== 1 ? 's' : ''} já existem ou falharam.`)
    }
  }

  async function handleDeleteSlot(id: string) {
    if (!confirm('Remover este slot? Todas as inscrições vinculadas também serão removidas.')) return
    const res = await fetch(`/api/segunda-chamada/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Falha ao remover slot.'); return }
    toast.success('Slot removido.'); loadData()
  }

  async function handleDeleteMultipleSlots() {
    if (selectedSlotIds.size === 0) return
    if (!confirm(`Remover ${selectedSlotIds.size} slot${selectedSlotIds.size !== 1 ? 's' : ''}?`)) return
    let successCount = 0
    for (const id of selectedSlotIds) {
      const res = await fetch(`/api/segunda-chamada/${id}`, { method: 'DELETE' })
      if (res.ok) successCount++
    }
    setSelectedSlotIds(new Set())
    toast.success(`${successCount} slot${successCount !== 1 ? 's' : ''} removido${successCount !== 1 ? 's' : ''}.`)
    loadData()
  }

  function toggleSlotSelection(slotId: string) {
    const next = new Set(selectedSlotIds)
    if (next.has(slotId)) next.delete(slotId); else next.add(slotId)
    setSelectedSlotIds(next)
  }

  async function confirmDeleteBooking() {
    if (!deleteBookingTarget) return
    const { id, name } = deleteBookingTarget; setDeleteBookingTarget(null)
    setDeletingBooking(id); removeBookingLocally(id)
    try {
      const res = await fetch(`/api/segunda-chamada/booking/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(`Inscrição de ${name} removida.`)
    } catch { toast.error('Falha ao remover inscrição.'); loadData() }
    finally { setDeletingBooking(null) }
  }

  async function handleApprove(id: string) {
    setActing(id); updateBookingLocally(id, { status: 'APPROVED' })
    try {
      const res = await fetch(`/api/segunda-chamada/booking/${id}/approve`, { method: 'POST' })
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
      const res = await fetch(`/api/segunda-chamada/booking/${id}/reject`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretariaReason: reason }),
      })
      if (!res.ok) throw new Error()
      toast.success('❌ Reprovado e e-mail enviado.')
    } catch { updateBookingLocally(id, { status: 'PENDING' }); toast.error('Falha ao reprovar.') }
    finally { setActing(null) }
  }

  async function confirmDeleteComp() {
    if (!deleteTarget) return
    const { id, name } = deleteTarget; setDeleteTarget(null)
    setDeletingComp(id)
    setComprovantes(prev => prev.filter(c => c.id !== id))
    try {
      const res = await fetch(`/api/segunda-chamada/booking/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(`Comprovante de ${name} removido.`)
    } catch { toast.error('Falha ao remover.'); loadComprovantes() }
    finally { setDeletingComp(null) }
  }

  // ── Agrupamentos ───────────────────────────────────────────────────────────
  // Por série → disciplina → slots
  const groupedByGrade = exams.reduce((acc, e) => {
    const g = e.grade; const dk = e.subjectName
    if (!acc[g]) acc[g] = {}
    if (!acc[g][dk]) acc[g][dk] = { subjectName: e.subjectName, slots: [] }
    acc[g][dk].slots.push(e); return acc
  }, {} as Record<string, Record<string, { subjectName: string; slots: ExamSchedule[] }>>)

  const globalCounts = exams.reduce(
    (acc, e) => { e.bookings.forEach(b => { const s = b.status ?? 'PENDING'; acc[s] = (acc[s] ?? 0) + 1 }); return acc },
    { PENDING: 0, APPROVED: 0, REJECTED: 0 } as Record<BookingStatus, number>
  )

  const compCounts = comprovantes.reduce(
    (acc, b) => { const s = b.status ?? 'PENDING'; acc[s] = (acc[s] ?? 0) + 1; return acc },
    { PENDING: 0, APPROVED: 0, REJECTED: 0 } as Record<BookingStatus, number>
  )

  const todasTurmasSlots = [...new Set(
    exams.flatMap(e => e.bookings.map(b => extractTurma(b.studentGrade))).filter(Boolean)
  )].sort()

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

  function getPrintData() {
    const studentMap = new Map<string, { name: string; grade: string; justifications: Set<string> }>()
    exams.forEach(exam => {
      exam.bookings.forEach(booking => {
        const key = `${booking.studentName}|${booking.studentGrade}`
        if (!studentMap.has(key)) studentMap.set(key, { name: booking.studentName, grade: booking.studentGrade, justifications: new Set() })
        const student = studentMap.get(key)!
        if (booking.reason === 'doenca') student.justifications.add('🩺 Doença')
        else if (booking.reason === 'luto') student.justifications.add('🕊️ Luto')
        else if (booking.autorizacaoText) student.justifications.add('✅ Autorizado pelo Coordenador')
        else if (booking.justified) student.justifications.add('📋 Justificado')
      })
    })
    return Array.from(studentMap.values()).map(s => ({ name: s.name, grade: s.grade, subjects: Array.from(s.justifications) }))
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid rgba(97,206,112,0.2)', fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#0a1a0d', background: 'white' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#6b8f72', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }

  return (
    <div style={{ minHeight: '100vh', background: '#f7fdf8' }}>
      <Toaster position="top-right" richColors closeButton />
      {showPrintView && <PrintByTurma students={getPrintData()} title="Segunda Chamada por Turma" />}
      <AnimatePresence>
        {rejectTarget        && <RejectModal studentName={rejectTarget.studentName}        onConfirm={confirmReject}      onCancel={() => setRejectTarget(null)} />}
        {deleteTarget        && <DeleteModal name={deleteTarget.name}        onConfirm={confirmDeleteComp}   onCancel={() => setDeleteTarget(null)} />}
        {deleteBookingTarget && <DeleteModal name={deleteBookingTarget.name} onConfirm={confirmDeleteBooking} onCancel={() => setDeleteBookingTarget(null)} />}
      </AnimatePresence>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
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
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 800, fontSize: 24, color: '#0a1a0d', margin: 0 }}>Segunda Chamada</h2>
          <p style={{ color: '#6b8f72', fontSize: 13, marginTop: 4 }}>Gerencie slots, analise justificativas e aprove ou reprove inscrições</p>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {([
              { key: 'slots',        label: 'Slots & Inscrições', icon: ClipboardList },
              { key: 'comprovantes', label: 'Comprovantes',       icon: FolderOpen, badge: pendingCompCount || null },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as ActiveTab)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, background: activeTab === tab.key ? '#4054B2' : 'white', color: activeTab === tab.key ? 'white' : '#6b8f72', boxShadow: activeTab === tab.key ? '0 4px 16px rgba(64,84,178,0.25)' : '0 1px 4px rgba(0,0,0,0.06)', border: activeTab === tab.key ? 'none' : '1px solid rgba(97,206,112,0.15)', transition: 'all 0.15s' }}>
                <tab.icon style={{ width: 14, height: 14 }} />{tab.label}
                {(tab as any).badge ? <span style={{ background: '#f97316', color: 'white', borderRadius: 999, fontSize: 10, fontWeight: 800, padding: '1px 6px', marginLeft: 2 }}>{(tab as any).badge}</span> : null}
              </button>
            ))}
          </div>

          {activeTab === 'slots' && !loading && (globalCounts.PENDING + globalCounts.APPROVED + globalCounts.REJECTED) > 0 && (
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['PENDING','APPROVED','REJECTED'] as BookingStatus[]).map(s => (
                  <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: STATUS_META[s].color, background: STATUS_META[s].bg, padding: '5px 12px', borderRadius: 8, border: `1px solid ${STATUS_META[s].border}` }}>
                    {STATUS_META[s].icon}{globalCounts[s]} {STATUS_META[s].label}{globalCounts[s] !== 1 ? 's' : ''}
                  </span>
                ))}
                <button onClick={() => setFilterPending(f => !f)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8, border: filterPending ? '1px solid #4054B2' : '1px solid rgba(64,84,178,0.2)', background: filterPending ? '#4054B2' : 'white', color: filterPending ? 'white' : '#4054B2', cursor: 'pointer' }}>
                  <Filter style={{ width: 12, height: 12 }} />{filterPending ? 'Mostrando só pendentes' : 'Mostrar só pendentes'}
                </button>
              </div>
              {todasTurmasSlots.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: '#6b8f72', fontWeight: 600 }}>Turma:</span>
                  <button onClick={() => setSlotFilterTurma('')}
                    style={{ padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: !slotFilterTurma ? '1px solid #4054B2' : '1px solid #e5e7eb', background: !slotFilterTurma ? '#eef1fb' : 'white', color: !slotFilterTurma ? '#4054B2' : '#6b7280' }}>
                    Todas
                  </button>
                  {todasTurmasSlots.map(t => (
                    <button key={t} onClick={() => setSlotFilterTurma(t === slotFilterTurma ? '' : t)}
                      style={{ padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: slotFilterTurma === t ? '1px solid #4054B2' : '1px solid #e5e7eb', background: slotFilterTurma === t ? '#eef1fb' : 'white', color: slotFilterTurma === t ? '#4054B2' : '#6b7280' }}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
              {selectedSlotIds.size > 0 && (
                <button onClick={handleDeleteMultipleSlots}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8, border: '1px solid #ef4444', background: '#fff5f5', color: '#ef4444', cursor: 'pointer' }}>
                  <Trash2 style={{ width: 12, height: 12 }} />Deletar {selectedSlotIds.size} slot{selectedSlotIds.size !== 1 ? 's' : ''}
                </button>
              )}
              {exams.flatMap(e => e.bookings).length > 0 && (
                <button onClick={() => { setShowPrintView(true); setTimeout(() => window.print(), 100) }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(64,84,178,0.3)', background: '#eef1fb', color: '#4054B2', cursor: 'pointer', marginLeft: 'auto' }}>
                  <Printer style={{ width: 13, height: 13 }} />Imprimir por Turma
                </button>
              )}
            </div>
          )}
        </div>

        {/* ════════ ABA: SLOTS ════════ */}
        {activeTab === 'slots' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)', gap: 24, alignItems: 'start' }}>

            {/* ── Formulário em lote ── */}
            <div style={{ background: 'white', borderRadius: 18, border: '1.5px solid rgba(97,206,112,0.15)', padding: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.04)', position: 'sticky', top: 76 }}>
              <h3 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 700, fontSize: 16, color: '#0a1a0d', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus style={{ width: 16, height: 16, color: '#4054B2' }} />Novo Slot de Segunda Chamada
              </h3>
              <p style={{ fontSize: 12, color: '#6b8f72', marginBottom: 18 }}>
                Escolha a data e selecione várias séries e disciplinas de uma vez.
              </p>

              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Data */}
                <div>
                  <label style={labelStyle}>Data da prova</label>
                  <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#4054B2'; e.target.style.boxShadow = '0 0 0 3px rgba(64,84,178,0.1)' }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.boxShadow = 'none' }} />
                </div>

                {/* Horários */}
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

                {/* Prazo de inscrições */}
                <div>
                  <label style={labelStyle}>
                    Última data de inscrições
                    <span style={{ marginLeft: 6, fontWeight: 400, textTransform: 'none', color: '#9ca3af' }}>(opcional)</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input type="date" value={regDeadline} onChange={e => setRegDeadline(e.target.value)}
                      max={examDate || undefined}
                      style={{ ...inputStyle, paddingRight: regDeadline ? 36 : 14, color: regDeadline ? '#0a1a0d' : '#9ca3af' }}
                      onFocus={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)' }}
                      onBlur={e  => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.boxShadow = 'none' }} />
                    {regDeadline && (
                      <button type="button" onClick={() => setRegDeadline('')}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 5 }}>
                    {regDeadline
                      ? `Inscrições encerram automaticamente no final do dia ${formatLocalInput(regDeadline)}.`
                      : 'Se não informado, inscrições ficam abertas até a data da prova.'}
                  </p>
                </div>

                {/* Séries + Disciplinas em lote */}
                <div>
                  <label style={labelStyle}>Séries e Disciplinas</label>
                  <div style={{ border: '1.5px solid rgba(64,84,178,0.2)', borderRadius: 12, overflow: 'hidden', maxHeight: 340, overflowY: 'auto' }}>
                    {grades.map(grade => {
                      const discsDaGrade = subjects.filter(s => s.grade === grade)
                      const selecionadas = loteSelecao[grade] ?? []
                      const todas        = selecionadas.length === discsDaGrade.length && discsDaGrade.length > 0

                      return (
                        <div key={grade} style={{ borderBottom: '1px solid rgba(64,84,178,0.1)' }}>
                          <div style={{ padding: '10px 14px', background: '#f7f9fe', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0a1a0d' }}>{grade}</span>
                            {discsDaGrade.length > 0 && (
                              <button type="button"
                                onClick={() => setLoteSelecao(prev => ({ ...prev, [grade]: todas ? [] : discsDaGrade.map(d => d.id) }))}
                                style={{ fontSize: 11, fontWeight: 600, color: '#4054B2', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
                                {todas ? 'Desmarcar todas' : 'Marcar todas'}
                              </button>
                            )}
                          </div>
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
                                    style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: sel ? '#4054B2' : 'white', color: sel ? 'white' : '#6b7280', border: sel ? '1.5px solid #4054B2' : '1.5px solid #e5e7eb', boxShadow: sel ? '0 2px 8px rgba(64,84,178,0.25)' : 'none' }}>
                                    {d.name}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {totalLote > 0 && (
                    <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: '#eef1fb', border: '1px solid rgba(64,84,178,0.2)' }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#4054B2' }}>
                        {totalLote} slot{totalLote !== 1 ? 's' : ''} serão criados
                        {regDeadline ? ` · prazo ${formatLocalInput(regDeadline)}` : ''}
                      </p>
                      <p style={{ margin: '3px 0 0', fontSize: 11, color: '#6b7280' }}>
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

                <button type="submit" disabled={saving || totalLote === 0}
                  style={{ padding: '12px', borderRadius: 10, border: 'none', background: saving || totalLote === 0 ? 'rgba(64,84,178,0.2)' : 'linear-gradient(135deg,#4054B2,#6b7fe8)', color: saving || totalLote === 0 ? 'rgba(255,255,255,0.5)' : 'white', fontSize: 14, fontWeight: 700, cursor: saving || totalLote === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: '"Roboto Slab",serif', boxShadow: saving || totalLote === 0 ? 'none' : '0 4px 16px rgba(64,84,178,0.3)' }}>
                  {saving ? 'Criando slots...' : <><Plus style={{ width: 15, height: 15 }} />{totalLote > 0 ? `Criar ${totalLote} slot${totalLote !== 1 ? 's' : ''}` : 'Adicionar Slots'}</>}
                </button>
              </form>
            </div>

            {/* ── Lista por série ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loading ? <LoadingSpinner /> : Object.keys(groupedByGrade).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', background: 'white', borderRadius: 20, border: '1.5px dashed rgba(97,206,112,0.3)' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                  <p style={{ fontWeight: 600, color: '#3d5c42', fontSize: 16 }}>Nenhum slot cadastrado</p>
                  <p style={{ color: '#6b8f72', fontSize: 14, marginTop: 6 }}>Use o formulário ao lado para adicionar slots de prova.</p>
                </div>
              ) : grades.map(grade => {
                const gradeData = groupedByGrade[grade]
                if (!gradeData) return null
                const allBookingsForGrade = Object.values(gradeData).flatMap(d => d.slots.flatMap(s => s.bookings))
                const pendingCountGrade   = allBookingsForGrade.filter(b => (b.status ?? 'PENDING') === 'PENDING').length
                if (filterPending && pendingCountGrade === 0) return null
                const isOpen = expandedGrade === grade

                return (
                  <motion.div key={grade} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'white', borderRadius: 16, border: '1.5px solid rgba(64,84,178,0.15)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                    <button onClick={() => setExpandedGrade(isOpen ? null : grade)}
                      style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#4054B2,#6b7fe8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <ClipboardList style={{ width: 18, height: 18, color: 'white' }} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 15, color: '#0a1a0d', margin: 0 }}>{grade}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#4054B2', background: '#eef1fb', borderRadius: 999, padding: '4px 10px' }}>
                              {Object.keys(gradeData).length} disciplina{Object.keys(gradeData).length !== 1 ? 's' : ''}
                            </span>
                            {allBookingsForGrade.length > 0 && (
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#23A455', background: '#e8f9eb', borderRadius: 999, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Users2 style={{ width: 12, height: 12 }} />{allBookingsForGrade.length} inscrito{allBookingsForGrade.length !== 1 ? 's' : ''}
                              </span>
                            )}
                            {pendingCountGrade > 0 && (
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#b45309', background: '#fef3c7', borderRadius: 999, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock style={{ width: 11, height: 11 }} />{pendingCountGrade} pendente{pendingCountGrade !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown style={{ width: 15, height: 15, color: '#6b8f72' }} />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                          <div style={{ borderTop: '1px solid rgba(64,84,178,0.1)', padding: '16px 20px', background: '#fafafe', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {Object.entries(gradeData).map(([disciplineKey, disciplineGroup]) => {
                              const allBookingsForDisc = disciplineGroup.slots.flatMap(s => s.bookings)
                              const pendingCountDisc   = allBookingsForDisc.filter(b => (b.status ?? 'PENDING') === 'PENDING').length
                              if (filterPending && pendingCountDisc === 0) return null
                              return (
                                <div key={disciplineKey} style={{ background: '#ffffff', borderRadius: 12, border: '1px solid rgba(64,84,178,0.15)', overflow: 'hidden' }}>
                                  <div style={{ padding: '12px 16px', background: '#f7f9fe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                    <div>
                                      <p style={{ fontWeight: 700, fontSize: 14, color: '#0a1a0d', margin: 0 }}>{disciplineGroup.subjectName}</p>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#4054B2' }}>{disciplineGroup.slots.length} slot{disciplineGroup.slots.length !== 1 ? 's' : ''}</span>
                                      </div>
                                    </div>
                                    {allBookingsForDisc.length > 0 && (
                                      <span style={{ fontSize: 11, fontWeight: 600, color: '#4054B2', background: '#eef1fb', borderRadius: 999, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                                        <Users2 style={{ width: 10, height: 10 }} />{allBookingsForDisc.length}
                                      </span>
                                    )}
                                  </div>

                                  <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {disciplineGroup.slots.map(slot => {
                                      const expired = deadlineExpired(slot.registrationDeadline)
                                      const vis = (() => {
                                        let filtered = filterPending
                                          ? slot.bookings.filter(b => (b.status ?? 'PENDING') === 'PENDING')
                                          : slot.bookings
                                        if (slotFilterTurma) filtered = filtered.filter(b => extractTurma(b.studentGrade) === slotFilterTurma)
                                        return filtered
                                      })()
                                      return (
                                        <div key={slot.id} style={{ background: '#fafafa', borderRadius: 10, border: `1px solid ${expired ? '#fecaca' : 'rgba(64,84,178,0.12)'}`, overflow: 'hidden' }}>
                                          {/* Cabeçalho do slot */}
                                          <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, background: expired ? '#fff5f5' : '#f7f9fe' }}>
                                            <div>
                                              <p style={{ fontWeight: 600, fontSize: 13, color: '#0a1a0d', margin: 0, textTransform: 'capitalize' }}>{formatDate(slot.date)}</p>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                                                <p style={{ fontSize: 12, color: expired ? '#ef4444' : '#4054B2', fontWeight: 600, margin: 0 }}>{slot.startTime} – {slot.endTime}</p>
                                                {slot.registrationDeadline && (
                                                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 5, background: expired ? '#fee2e2' : '#dbeafe', color: expired ? '#991b1b' : '#1e3a5f' }}>
                                                    {expired ? `Encerrado · ${formatDateShort(slot.registrationDeadline)}` : `Prazo: ${formatDateShort(slot.registrationDeadline)}`}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                              <input type="checkbox" checked={selectedSlotIds.has(slot.id)} onChange={() => toggleSlotSelection(slot.id)}
                                                style={{ cursor: 'pointer', width: 14, height: 14 }} title="Selecionar para deleção em massa" />
                                              <span style={{ fontSize: 11, color: '#4054B2', background: '#eef1fb', borderRadius: 999, padding: '2px 8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, border: '1px solid rgba(64,84,178,0.2)' }}>
                                                <Users2 style={{ width: 10, height: 10 }} />{slot.bookings.length}
                                              </span>
                                              <button onClick={() => handleCopySlot(slot)} title="Copiar data e horário"
                                                style={{ padding: 4, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6, color: '#4054B2' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#eef1fb'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <Copy style={{ width: 12, height: 12 }} />
                                              </button>
                                              <button onClick={() => handleDeleteSlot(slot.id)} title="Remover slot"
                                                style={{ padding: 4, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6, color: '#ef4444' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <Trash2 style={{ width: 12, height: 12 }} />
                                              </button>
                                            </div>
                                          </div>

                                          {/* Inscrições */}
                                          {vis.length > 0 && (
                                            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid rgba(64,84,178,0.1)' }}>
                                              <p style={{ fontSize: 11, fontWeight: 700, color: '#4054B2', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>Inscritos — justificativas</p>
                                              {vis.map((b, i) => {
                                                const isJustified = computeJustified(b)
                                                const isBusy      = acting === b.id
                                                const isDelBook   = deletingBooking === b.id
                                                return (
                                                  <div key={b.id} style={{ borderRadius: 8, border: isJustified ? '1.5px solid #86efac' : '1.5px solid #fca5a5', background: isJustified ? '#f0fdf4' : '#fff5f5', overflow: 'hidden', opacity: isDelBook ? 0.5 : 1 }}>
                                                    <div style={{ padding: '8px 12px' }}>
                                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                                                          <span style={{ fontSize: 12, fontWeight: 700, color: '#0a1a0d' }}>{b.studentName}</span>
                                                          <span style={{ fontSize: 9, color: '#9ca3af' }}>#{i + 1}</span>
                                                          <StatusBadge status={b.status} />
                                                          {extractTurma(b.studentGrade) && (
                                                            <span style={{ fontSize: 11, fontWeight: 700, color: '#4054B2', background: '#eef1fb', padding: '2px 7px', borderRadius: 5 }}>
                                                              📚 {extractTurma(b.studentGrade)}
                                                            </span>
                                                          )}
                                                          {isJustified
                                                            ? <span style={{ fontSize: 11, color: '#166534', background: '#dcfce7', padding: '2px 7px', borderRadius: 5, fontWeight: 600 }}>✔ Justificado</span>
                                                            : <span style={{ fontSize: 11, color: '#991b1b', background: '#fee2e2', padding: '2px 7px', borderRadius: 5, fontWeight: 600 }}>✘ Não justificado</span>
                                                          }
                                                        </div>
                                                        <button onClick={() => setDeleteBookingTarget({ id: b.id, name: b.studentName })} disabled={isBusy || isDelBook}
                                                          style={{ padding: 3, border: 'none', background: 'transparent', cursor: isBusy || isDelBook ? 'not-allowed' : 'pointer', borderRadius: 5, color: '#ef4444', flexShrink: 0 }}
                                                          onMouseEnter={e => { if (!isBusy && !isDelBook) e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
                                                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                          <Trash2 style={{ width: 11, height: 11 }} />
                                                        </button>
                                                      </div>
                                                      <p style={{ fontSize: 11, color: '#6b7280', margin: '3px 0 0' }}>
                                                        {b.parentEmail} · {b.parentPhone}
                                                      </p>
                                                      {b.reason && (
                                                        <p style={{ fontSize: 11, color: '#374151', margin: '3px 0 0' }}>
                                                          <span style={{ fontWeight: 600, color: '#6b7280' }}>Motivo: </span>{reasonLabel(b.reason)}
                                                        </p>
                                                      )}
                                                      {b.lutoText && (
                                                        <p style={{ fontSize: 11, color: '#374151', margin: '2px 0 0' }}>
                                                          <span style={{ fontWeight: 600, color: '#6b7280' }}>Obs: </span>{b.lutoText}
                                                        </p>
                                                      )}
                                                      {b.autorizacaoText && (
                                                        <p style={{ fontSize: 11, color: '#374151', margin: '2px 0 0' }}>
                                                          <span style={{ fontWeight: 600, color: '#6b7280' }}>Autorização: </span>{b.autorizacaoText}
                                                        </p>
                                                      )}
                                                    </div>
                                                    <div style={{ padding: '6px 12px', borderTop: `1px solid ${isJustified ? '#bbf7d0' : '#fecaca'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                                      {b.fileUrl
                                                        ? <a href={b.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#4054B2', textDecoration: 'none', background: '#eef1fb', padding: '3px 8px', borderRadius: 5 }}>
                                                            <Paperclip style={{ width: 10, height: 10 }} />Ver comprovante
                                                          </a>
                                                        : <span style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 3 }}><Paperclip style={{ width: 10, height: 10 }} />Sem comprovante</span>
                                                      }
                                                      <div style={{ display: 'flex', gap: 4 }}>
                                                        {b.status !== 'APPROVED' && (
                                                          <button onClick={() => handleApprove(b.id)} disabled={isBusy}
                                                            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: 'white', background: isBusy ? '#86efac' : '#22c55e', border: 'none', padding: '4px 10px', borderRadius: 5, cursor: isBusy ? 'not-allowed' : 'pointer' }}>
                                                            <CheckCircle style={{ width: 10, height: 10 }} />{isBusy ? '...' : 'Aprovar'}
                                                          </button>
                                                        )}
                                                        {b.status !== 'REJECTED' && (
                                                          <button onClick={() => setRejectTarget({ id: b.id, studentName: b.studentName })} disabled={isBusy}
                                                            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: 'white', background: isBusy ? '#fca5a5' : '#ef4444', border: 'none', padding: '4px 10px', borderRadius: 5, cursor: isBusy ? 'not-allowed' : 'pointer' }}>
                                                            <XCircle style={{ width: 10, height: 10 }} />{isBusy ? '...' : 'Reprovar'}
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
                                            <div style={{ padding: '10px 12px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
                                              {filterPending && slot.bookings.length > 0 ? 'Nenhum pendente.' : 'Sem inscritos.'}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
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

        {/* ════════ ABA: COMPROVANTES ════════ */}
        {activeTab === 'comprovantes' && (
          <div>
            {/* Busca e filtros */}
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
                      style={{ padding: '6px 12px', borderRadius: 8, border: compFilter === f.key ? '1px solid #4054B2' : '1px solid #e5e7eb', background: compFilter === f.key ? '#eef1fb' : 'white', color: compFilter === f.key ? '#4054B2' : '#6b7280', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {f.label}
                    </button>
                  ))}
                </div>
                {todasTurmasComp.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: '#6b8f72', fontWeight: 600 }}>Turma:</span>
                    <button onClick={() => setCompFilterTurma('')}
                      style={{ padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: !compFilterTurma ? '1px solid #4054B2' : '1px solid #e5e7eb', background: !compFilterTurma ? '#eef1fb' : 'white', color: !compFilterTurma ? '#4054B2' : '#6b7280' }}>
                      Todas
                    </button>
                    {todasTurmasComp.map(t => (
                      <button key={t} onClick={() => setCompFilterTurma(t === compFilterTurma ? '' : t)}
                        style={{ padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: compFilterTurma === t ? '1px solid #4054B2' : '1px solid #e5e7eb', background: compFilterTurma === t ? '#eef1fb' : 'white', color: compFilterTurma === t ? '#4054B2' : '#6b7280' }}>
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
              <div style={{ textAlign: 'center', padding: '40px 24px', background: 'white', borderRadius: 16, border: '1px solid #f3f4f6' }}>
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
                  const typeColor   = b.reason === 'doenca'
                    ? { bg: '#eff6ff', color: '#1d4ed8', icon: <FileText style={{ width: 16, height: 16, color: '#3b82f6' }} /> }
                    : b.reason === 'luto'
                      ? { bg: '#f5f3ff', color: '#7c3aed', icon: <Heart style={{ width: 16, height: 16, color: '#8b5cf6' }} /> }
                      : { bg: '#fff7ed', color: '#c2410c', icon: <FolderOpen style={{ width: 16, height: 16, color: '#f97316' }} /> }

                  return (
                    <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: isDeleting ? 0.4 : 1, y: 0 }} layout
                      style={{ background: 'white', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', transition: 'opacity 0.2s' }}>

                      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: typeColor.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {typeColor.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#0a1a0d' }}>{b.parentName}</span>
                            <StatusBadge status={b.status} />
                            {rlabel && <span style={{ fontSize: 11, fontWeight: 600, color: typeColor.color, background: typeColor.bg, padding: '2px 8px', borderRadius: 5 }}>{rlabel}</span>}
                            {b.fileUrl && <span style={{ fontSize: 11, fontWeight: 600, color: '#4054B2', background: '#eef1fb', padding: '2px 8px', borderRadius: 5, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Paperclip style={{ width: 10, height: 10 }} />Anexo</span>}
                          </div>
                          <p style={{ fontSize: 12, color: '#6b7280', margin: '3px 0 0' }}>
                            Aluno: <strong style={{ color: '#374151' }}>{b.studentName}</strong>
                            <span style={{ color: '#d1d5db', margin: '0 6px' }}>·</span>
                            {b.examSchedule.subjectName} — {b.examSchedule.grade}
                            <span style={{ color: '#d1d5db', margin: '0 6px' }}>·</span>
                            {formatDateShort(b.examSchedule.date)}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <button onClick={e => { e.stopPropagation(); setDeleteTarget({ id: b.id, name: b.parentName }) }} disabled={isDeleting}
                            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444', cursor: isDeleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => { if (!isDeleting) { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white' } }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444' }}>
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
                                    <p style={{ fontSize: 11, fontWeight: 700, color: '#4054B2', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>Prova</p>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0a1a0d', margin: 0 }}>{b.examSchedule.subjectName}</p>
                                    <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>{b.examSchedule.grade}</p>
                                    <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0', textTransform: 'capitalize' }}>{formatDate(b.examSchedule.date)}</p>
                                    <p style={{ fontSize: 13, color: '#4054B2', fontWeight: 600, margin: '4px 0 0' }}>{b.examSchedule.startTime} – {b.examSchedule.endTime}</p>
                                  </div>
                                  <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>Contato</p>
                                    <p style={{ fontSize: 12, color: '#374151', margin: 0 }}>📧 {b.parentEmail}</p>
                                    <p style={{ fontSize: 12, color: '#374151', margin: '3px 0 0' }}>📱 {b.parentPhone}</p>
                                    <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>Enviado: {formatDateTime(b.createdAt)}</p>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                  {b.lutoText && (
                                    <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: '12px 14px' }}>
                                      <p style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>🕊️ Descrição</p>
                                      <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.5 }}>{b.lutoText}</p>
                                    </div>
                                  )}
                                  {b.autorizacaoText && (
                                    <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: 10, padding: '12px 14px' }}>
                                      <p style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>✅ Autorização da Coordenação</p>
                                      <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.5 }}>{b.autorizacaoText}</p>
                                    </div>
                                  )}
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
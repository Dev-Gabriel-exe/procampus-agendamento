// app/segunda-chamada/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Check, ClipboardList,
  User, Mail, Phone, GraduationCap, CheckCircle,
  ChevronDown, MapPin, CalendarDays, Clock,
  AlertCircle, FileText, Heart, Upload, Copy,
  Sun, Moon, CalendarPlus,
} from 'lucide-react'
import { getTurmas, buildStudentGrade } from '@/lib/turmas'
import { generateCalendarLink } from '@/lib/calendar-link'

const ALL_GRADES = [
  'Educação Infantil',
  '1º Ano Fundamental','2º Ano Fundamental','3º Ano Fundamental','4º Ano Fundamental','5º Ano Fundamental',
  '6º Ano Fundamental','7º Ano Fundamental','8º Ano Fundamental','9º Ano Fundamental',
  '1ª Série Médio','2ª Série Médio','3ª Série Médio',
]

const GRADES_FUND1 = new Set([
  'Educação Infantil',
  '1º Ano Fundamental','2º Ano Fundamental','3º Ano Fundamental','4º Ano Fundamental','5º Ano Fundamental',
])

const PIX_KEY          = 'financeiro@procampus.com.br'
const PIX_NAME         = 'SOCIEDADE EDUCACIONAL DO PIAUI S/S LTDA'
const PRICE_PER_SUBJ   = 30  // R$ por disciplina (falta NÃO justificada)

type Subject      = { id: string; name: string }
type ExamSchedule = {
  id: string; subjectName: string; grade: string
  date: string; startTime: string; endTime: string; bookings: { id: string }[]
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Fortaleza' })
}
function formatDateShort(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Fortaleza' })
}
function maskPhoneBr(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2)  return `(${d}`
  if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

const slide = {
  enter:  (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit:   (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
}

// ── Copiar chave PIX ────────────────────────────────────────────────────────
function CopyPixButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    try { await navigator.clipboard.writeText(value) } catch {
      const el = document.createElement('textarea'); el.value = value
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true); setTimeout(() => setCopied(false), 2500)
  }
  return (
    <motion.button onClick={handleCopy} whileTap={{ scale: 0.96 }}
      style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: copied ? '2px solid #22c55e' : '2px dashed rgba(255,255,255,0.25)', background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.07)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s', gap: 12, fontFamily: 'inherit' }}>
      <div style={{ textAlign: 'left', minWidth: 0 }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: 0, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Chave PIX</p>
        <p style={{ fontSize: 15, color: 'white', margin: '3px 0 0', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
      </div>
      <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, background: copied ? '#22c55e' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
        <AnimatePresence mode="wait">
          {copied
            ? <motion.div key="ck" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check style={{ width: 16, height: 16, color: 'white' }} /></motion.div>
            : <motion.div key="cp" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Copy style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.7)' }} /></motion.div>
          }
        </AnimatePresence>
      </div>
    </motion.button>
  )
}

// ── Indicador de steps ─────────────────────────────────────────────────────
function Steps({ current }: { current: number }) {
  const labels = ['Prova', 'Justificativa', 'Dados']
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
      {labels.map((label, i) => {
        const n = i + 1; const done = current > n; const active = current === n
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: done || active ? '#4054B2' : 'rgba(255,255,255,0.08)', color: done || active ? 'white' : 'rgba(255,255,255,0.3)', border: done || active ? 'none' : '1.5px solid rgba(255,255,255,0.12)' }}>
                {done ? <Check style={{ width: 12, height: 12 }} /> : n}
              </div>
              <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, whiteSpace: 'nowrap', color: active ? 'white' : done ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.28)' }}>{label}</span>
            </div>
            {i < labels.length - 1 && <div style={{ width: 16, height: 1, background: 'rgba(255,255,255,0.1)', margin: '0 6px', flexShrink: 0 }} />}
          </div>
        )
      })}
    </div>
  )
}

async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? 'ml_default')
  const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`, { method: 'POST', body: formData })
  if (!res.ok) throw new Error('Upload falhou')
  const data = await res.json()
  if (!data.secure_url) throw new Error('URL não retornada')
  return data.secure_url
}

export default function SegundaChamadaPage() {
  const [step, setStep] = useState(1)
  const [dir,  setDir]  = useState(1)
  function goTo(next: number) { setDir(next > step ? 1 : -1); setStep(next) }

  // ── Step 1 ────────────────────────────────────────────────────────────────
  const [selGrade,      setSelGrade]      = useState('')
  const [selTurma,      setSelTurma]      = useState('')
  const [selTurno,      setSelTurno]      = useState<'manha' | 'tarde' | ''>('')
  const [allSubjects,   setAllSubjects]   = useState<Subject[]>([])
  const [selSubjects,   setSelSubjects]   = useState<string[]>([])    // nomes das disciplinas selecionadas
  const [slotsPerSubj,  setSlotsPerSubj]  = useState<Record<string, ExamSchedule[]>>({}) // subjectName → slots disponíveis
  const [selectedSlots, setSelectedSlots] = useState<Record<string, ExamSchedule>>({})   // subjectName → slot escolhido
  const [loadingSlots,  setLoadingSlots]  = useState(false)
  const [hasSearched,   setHasSearched]   = useState(false)

  const turmasDisponiveis = getTurmas(selGrade)
  const isFund1Grade      = GRADES_FUND1.has(selGrade)

  // Requer turno para Fund1
  const canSearch = selGrade && selSubjects.length > 0 && (!isFund1Grade || selTurno !== '')
  // Todos os horários escolhidos?
  const allSlotsChosen = selSubjects.length > 0 && selSubjects.every(s => !!selectedSlots[s])

  // ── Step 2 — Justificativa ────────────────────────────────────────────────
  const [isJustified,     setIsJustified]     = useState<boolean | null>(null)
  const [justReason,      setJustReason]      = useState<'doenca' | 'luto' | 'autorizacao' | null>(null)
  const [lutoText,        setLutoText]        = useState('')
  const [autorizacaoText, setAutorizacaoText] = useState('')
  const [attachFile,      setAttachFile]      = useState<File | null>(null)
  const [uploadingFile,   setUploadingFile]   = useState(false)

  // PIX dinâmico — só para falta NÃO justificada
  const pixTotal    = selSubjects.length * PRICE_PER_SUBJ
  const pixValueStr = `R$ ${pixTotal},00`

  // ── Step 3 — Dados ────────────────────────────────────────────────────────
  const [parentName,  setParentName]  = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [studentName, setStudentName] = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Reset ao trocar série
  useEffect(() => {
    setAllSubjects([]); setSelSubjects([]); setSlotsPerSubj({})
    setSelectedSlots({}); setHasSearched(false); setSelTurma(''); setSelTurno('')
    if (!selGrade) return
    ;(async () => {
      try {
        const res = await fetch(`/api/disciplinas?grade=${encodeURIComponent(selGrade)}`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        setAllSubjects(data)
      } catch { setAllSubjects([]) }
    })()
  }, [selGrade])

  // Limpar slots de disciplinas removidas
  useEffect(() => {
    setSlotsPerSubj(prev => {
      const next: Record<string, ExamSchedule[]> = {}
      selSubjects.forEach(s => { if (prev[s]) next[s] = prev[s] })
      return next
    })
    setSelectedSlots(prev => {
      const next: Record<string, ExamSchedule> = {}
      selSubjects.forEach(s => { if (prev[s]) next[s] = prev[s] })
      return next
    })
  }, [selSubjects])

  function toggleSubject(name: string) {
    setSelSubjects(prev =>
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    )
    setHasSearched(false)
  }

  async function loadSlots() {
    if (!canSearch) return
    setLoadingSlots(true); setHasSearched(true)
    try {
      const turnoParam = isFund1Grade && selTurno ? `&turno=${selTurno}` : ''
      const results = await Promise.all(
        selSubjects.map(async subjName => {
          const res = await fetch(
            `/api/segunda-chamada?public=true&grade=${encodeURIComponent(selGrade)}&subject=${encodeURIComponent(subjName)}${turnoParam}`
          )
          const data = await res.json()
          return { subjName, slots: Array.isArray(data) ? data : [] as ExamSchedule[] }
        })
      )
      const map: Record<string, ExamSchedule[]> = {}
      results.forEach(r => { map[r.subjName] = r.slots })
      setSlotsPerSubj(map)
    } catch {
      const map: Record<string, ExamSchedule[]> = {}
      selSubjects.forEach(s => { map[s] = [] })
      setSlotsPerSubj(map)
    }
    finally { setLoadingSlots(false) }
  }

  function step2Ok(): boolean {
    if (isJustified === null) return false
    if (!isJustified) return !!attachFile
    if (!justReason)  return false
    if (justReason === 'doenca') return !!attachFile
    if (justReason === 'luto')   return lutoText.trim().length > 10
    if (justReason === 'autorizacao') return autorizacaoText.trim().length > 10
    return false
  }

  const formOk = parentName.trim().length > 3 && parentEmail.includes('@') && parentPhone.replace(/\D/g, '').length >= 10 && studentName.trim().length > 3

  async function handleSubmit() {
    const entries = Object.entries(selectedSlots)
    if (!entries.length) return
    setSubmitting(true); setSubmitError('')
    try {
      let fileUrl: string | null = null
      if (attachFile) { setUploadingFile(true); fileUrl = await uploadToCloudinary(attachFile); setUploadingFile(false) }

      // Envia uma inscrição por disciplina
      await Promise.all(
        entries.map(([subject, slot]) =>
          fetch(`/api/segunda-chamada/${slot.id}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              parentName, parentEmail, parentPhone, studentName,
              studentGrade: buildStudentGrade(selGrade, selTurma),
              subjects: subject,
              justified: isJustified ?? false,
              reason: justReason,
              lutoText: justReason === 'luto' ? lutoText : null,
              autorizacaoText: justReason === 'autorizacao' ? autorizacaoText : null,
              fileUrl,
            }),
          }).then(async r => {
            if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Erro ao inscrever.') }
          })
        )
      )
      goTo(4)
    } catch (err: any) { setSubmitError(err?.message || 'Erro de conexão.') }
    finally { setSubmitting(false); setUploadingFile(false) }
  }

  // ── Estilos base ───────────────────────────────────────────────────────────
  const card: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(64,84,178,0.2)', borderRadius: 18, padding: '18px 16px' }
  const inputBase: React.CSSProperties = { width: '100%', padding: '14px 16px', borderRadius: 14, border: '1.5px solid rgba(64,84,178,0.2)', background: 'rgba(255,255,255,0.06)', color: 'white', fontSize: 16, outline: 'none', fontFamily: 'inherit', transition: 'all 0.2s', boxSizing: 'border-box' as const, WebkitAppearance: 'none' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }
  const btnPrimary = (disabled = false): React.CSSProperties => ({ width: '100%', padding: '17px 16px', borderRadius: 14, border: 'none', background: disabled ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#4054B2,#6b7fe8)', color: disabled ? 'rgba(255,255,255,0.2)' : 'white', fontSize: 16, fontWeight: 800, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: '"Roboto Slab",serif', boxShadow: disabled ? 'none' : '0 8px 30px rgba(64,84,178,0.35)', transition: 'all 0.3s', minHeight: 54 })
  const btnBack: React.CSSProperties = { flex: 1, padding: '16px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 54 }
  const choiceBtn = (active: boolean, color = '#4054B2'): React.CSSProperties => ({ flex: 1, padding: '16px 12px', borderRadius: 14, border: `2px solid ${active ? color : 'rgba(64,84,178,0.2)'}`, background: active ? `${color}22` : 'rgba(255,255,255,0.04)', color: active ? 'white' : 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minHeight: 80, justifyContent: 'center' })

  return (
    <div style={{ minHeight: '100vh', background: '#08091a', overscrollBehavior: 'none' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(8,9,26,0.96)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(64,84,178,0.15)', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 38 }}>
              <ArrowLeft style={{ width: 15, height: 15 }} />Voltar
            </button>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Pro Campus" style={{ width: 26, height: 26, objectFit: 'contain' }} />
            <span style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 800, color: 'white', fontSize: 14 }}>Pro Campus</span>
          </div>
          <div style={{ width: 72 }} />
        </div>
        {step < 4 && (
          <div style={{ padding: '10px 16px 12px', maxWidth: 520, margin: '0 auto' }}>
            <Steps current={step} />
          </div>
        )}
      </div>

      <div style={{ height: step < 4 ? 100 : 52 }} />

      <main style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px 40px', paddingBottom: 'max(40px, calc(env(safe-area-inset-bottom, 0px) + 24px))' }}>
        {step < 4 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20, textAlign: 'center' }}>
            <h1 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 900, fontSize: 24, color: 'white', margin: 0 }}>
              {step === 1 ? 'Segunda Chamada' : step === 2 ? 'Justificativa' : 'Seus dados'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', marginTop: 6, fontSize: 14, lineHeight: 1.4 }}>
              {step === 1 ? 'Escolha as disciplinas e os horários'
                : step === 2 ? 'Informe o motivo da ausência'
                : 'Preencha para confirmar a inscrição'}
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="wait" custom={dir}>

          {/* ══════════════════════════════════════════════════════════════════
              STEP 1 — Série, turma, disciplinas, horários
          ══════════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <motion.div key="s1" custom={dir} variants={slide} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.28, ease: [0.22,1,0.36,1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Série */}
              <div style={card}>
                <label style={labelStyle}>Série do aluno</label>
                <div style={{ position: 'relative' }}>
                  <select value={selGrade} onChange={e => setSelGrade(e.target.value)}
                    style={{ ...inputBase, paddingRight: 44, appearance: 'none', cursor: 'pointer', color: selGrade ? 'white' : 'rgba(255,255,255,0.3)' }}>
                    <option value="" style={{ background: '#08091a' }}>Selecione a série</option>
                    {ALL_GRADES.map(g => <option key={g} value={g} style={{ background: '#08091a' }}>{g}</option>)}
                  </select>
                  <ChevronDown style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Turma */}
              <AnimatePresence>
                {selGrade && turmasDisponiveis.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={card}>
                    <label style={labelStyle}>Turma do aluno</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {turmasDisponiveis.map(t => (
                        <button key={t} onClick={() => setSelTurma(t)}
                          style={{ padding: '11px 18px', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', minHeight: 44, background: selTurma === t ? 'linear-gradient(135deg,#4054B2,#6b7fe8)' : 'rgba(255,255,255,0.06)', color: selTurma === t ? 'white' : 'rgba(255,255,255,0.65)', border: selTurma === t ? '2px solid transparent' : '1.5px solid rgba(64,84,178,0.2)', boxShadow: selTurma === t ? '0 4px 20px rgba(64,84,178,0.35)' : 'none' }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Disciplinas */}
              <AnimatePresence>
                {selGrade && allSubjects.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={card}>
                    <label style={labelStyle}>
                      Disciplinas em falta
                      {selSubjects.length > 0 && (
                        <span style={{ marginLeft: 6, color: '#a0aff8', fontWeight: 400, textTransform: 'none' }}>
                          ({selSubjects.length} selecionada{selSubjects.length > 1 ? 's' : ''})
                        </span>
                      )}
                    </label>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 12px', lineHeight: 1.4 }}>
                      Selecione todas as disciplinas que o aluno faltou para fazer segunda chamada.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {allSubjects.map(s => {
                        const checked = selSubjects.includes(s.name)
                        return (
                          <button key={s.id} onClick={() => toggleSubject(s.name)}
                            style={{ padding: '10px 14px', borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', minHeight: 44, background: checked ? 'linear-gradient(135deg,#4054B2,#6b7fe8)' : 'rgba(255,255,255,0.06)', color: checked ? 'white' : 'rgba(255,255,255,0.65)', border: checked ? '2px solid transparent' : '1.5px solid rgba(64,84,178,0.2)', boxShadow: checked ? '0 4px 20px rgba(64,84,178,0.35)' : 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {checked && <Check style={{ width: 13, height: 13 }} />}{s.name}
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {selGrade && allSubjects.length === 0 && (
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Nenhuma disciplina disponível para esta série.</p>
              )}

              {/* Turno — só Fund1 */}
              <AnimatePresence>
                {selGrade && selSubjects.length > 0 && isFund1Grade && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={card}>
                    <label style={labelStyle}>Turno que o aluno estuda</label>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '0 0 14px', lineHeight: 1.5 }}>
                      A prova de segunda chamada ocorre no turno <strong style={{ color: 'rgba(255,255,255,0.7)' }}>oposto</strong> ao que o aluno estuda.
                    </p>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => setSelTurno('manha')}
                        style={{ ...choiceBtn(selTurno === 'manha', '#f59e0b'), border: `2px solid ${selTurno === 'manha' ? '#f59e0b' : 'rgba(64,84,178,0.2)'}`, background: selTurno === 'manha' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)' }}>
                        <Sun style={{ width: 24, height: 24, color: selTurno === 'manha' ? '#fbbf24' : 'rgba(255,255,255,0.25)' }} />
                        <span>Manhã</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>prova à tarde</span>
                      </button>
                      <button onClick={() => setSelTurno('tarde')}
                        style={{ ...choiceBtn(selTurno === 'tarde', '#6366f1'), border: `2px solid ${selTurno === 'tarde' ? '#6366f1' : 'rgba(64,84,178,0.2)'}`, background: selTurno === 'tarde' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)' }}>
                        <Moon style={{ width: 24, height: 24, color: selTurno === 'tarde' ? '#a5b4fc' : 'rgba(255,255,255,0.25)' }} />
                        <span>Tarde</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>prova de manhã</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botão buscar */}
              <AnimatePresence>
                {canSearch && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <button onClick={loadSlots} style={btnPrimary(false)}>
                      <ClipboardList style={{ width: 18, height: 18 }} />Ver horários disponíveis
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {loadingSlots && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 28 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid rgba(64,84,178,0.2)', borderTopColor: '#4054B2', animation: 'spin .7s linear infinite' }} />
                </div>
              )}

              {/* ── Slots agrupados por disciplina ── */}
              {!loadingSlots && hasSearched && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {selSubjects.map(subject => {
                    const slots  = slotsPerSubj[subject] ?? []
                    const chosen = selectedSlots[subject]
                    return (
                      <div key={subject}>
                        {/* Cabeçalho da disciplina */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <div style={{ flex: 1, height: 1, background: 'rgba(64,84,178,0.2)' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: chosen ? '#a0aff8' : 'rgba(255,255,255,0.55)' }}>{subject}</span>
                            {chosen && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#a0aff8', background: 'rgba(64,84,178,0.2)', padding: '2px 8px', borderRadius: 100 }}>
                                <Check style={{ width: 10, height: 10 }} />Selecionado
                              </span>
                            )}
                          </div>
                          <div style={{ flex: 1, height: 1, background: 'rgba(64,84,178,0.2)' }} />
                        </div>

                        {slots.length === 0 ? (
                          <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Nenhum horário disponível para {subject}.</p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {slots.map(slot => {
                              const isSel = chosen?.id === slot.id
                              return (
                                <motion.button key={slot.id} onClick={() => setSelectedSlots(prev => ({ ...prev, [subject]: slot }))} whileTap={{ scale: 0.98 }}
                                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s', minHeight: 68, background: isSel ? 'rgba(64,84,178,0.2)' : 'rgba(255,255,255,0.04)', border: isSel ? '2px solid rgba(64,84,178,0.6)' : '1.5px solid rgba(64,84,178,0.12)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: isSel ? 'rgba(64,84,178,0.35)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <CalendarDays style={{ width: 17, height: 17, color: isSel ? '#6b7fe8' : 'rgba(255,255,255,0.35)' }} />
                                    </div>
                                    <div>
                                      <p style={{ fontWeight: 700, fontSize: 14, color: 'white', margin: 0, textTransform: 'capitalize' }}>{formatDate(slot.date)}</p>
                                      <p style={{ fontSize: 13, margin: '3px 0 0', display: 'flex', alignItems: 'center', gap: 4, color: isSel ? '#a0aff8' : 'rgba(255,255,255,0.38)' }}>
                                        <Clock style={{ width: 12, height: 12 }} />{slot.startTime} – {slot.endTime}
                                      </p>
                                    </div>
                                  </div>
                                  {isSel
                                    ? <Check style={{ width: 20, height: 20, color: '#6b7fe8', flexShrink: 0 }} />
                                    : <ArrowRight style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.18)', flexShrink: 0 }} />}
                                </motion.button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Progresso */}
                  {selSubjects.length > 1 && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                        {Object.keys(selectedSlots).length} de {selSubjects.length} horários escolhidos
                      </span>
                      {allSlotsChosen && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7fe8', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle style={{ width: 13, height: 13 }} />Tudo pronto
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              <motion.button disabled={!allSlotsChosen} onClick={() => goTo(2)} whileTap={{ scale: allSlotsChosen ? 0.98 : 1 }} style={btnPrimary(!allSlotsChosen)}>
                Continuar <ArrowRight style={{ width: 18, height: 18 }} />
              </motion.button>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 2 — Justificativa
          ══════════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <motion.div key="s2" custom={dir} variants={slide} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.28, ease: [0.22,1,0.36,1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Resumo das disciplinas selecionadas */}
              <div style={{ background: 'rgba(64,84,178,0.12)', border: '1px solid rgba(64,84,178,0.25)', borderRadius: 14, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <ClipboardList style={{ width: 15, height: 15, color: '#6b7fe8', flexShrink: 0 }} />
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'white', margin: 0 }}>{selGrade}</p>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#a0aff8', background: 'rgba(64,84,178,0.2)', padding: '2px 8px', borderRadius: 5 }}>
                    {selSubjects.length} disciplina{selSubjects.length > 1 ? 's' : ''}
                  </span>
                </div>
                {Object.entries(selectedSlots).map(([subject, slot]) => (
                  <div key={subject} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderTop: '1px solid rgba(64,84,178,0.15)' }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{subject}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>
                      {formatDateShort(slot.date)} · {slot.startTime}–{slot.endTime}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pergunta de justificativa */}
              <div style={card}>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: '0 0 14px' }}>A falta foi justificada?</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { setIsJustified(true); setAttachFile(null) }} style={choiceBtn(isJustified === true, '#22c55e')}>
                    <CheckCircle style={{ width: 24, height: 24, color: isJustified === true ? '#22c55e' : 'rgba(255,255,255,0.25)' }} />
                    <span>Sim</span><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>justificada</span>
                  </button>
                  <button onClick={() => { setIsJustified(false); setJustReason(null); setLutoText(''); setAttachFile(null) }} style={choiceBtn(isJustified === false, '#ef4444')}>
                    <AlertCircle style={{ width: 24, height: 24, color: isJustified === false ? '#ef4444' : 'rgba(255,255,255,0.25)' }} />
                    <span>Não</span><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>sem motivo</span>
                  </button>
                </div>
              </div>

              {/* NÃO justificada → PIX */}
              <AnimatePresence>
                {isJustified === false && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ ...card, borderColor: 'rgba(249,115,22,0.3)', background: 'rgba(249,115,22,0.06)' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#fb923c', margin: '0 0 4px' }}>💸 Taxa de segunda chamada</p>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 16px', lineHeight: 1.5 }}>
                        {selSubjects.length > 1
                          ? `${selSubjects.length} disciplinas × R$ ${PRICE_PER_SUBJ},00 = ${pixValueStr}. Realize o pagamento via PIX e anexe o comprovante.`
                          : 'Para faltas não justificadas é necessário o pagamento antes da prova.'}
                      </p>
                      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Valor total</p>
                          <p style={{ fontSize: 26, fontWeight: 900, color: '#4ade80', margin: '2px 0 0', fontFamily: '"Roboto Slab",serif' }}>{pixValueStr}</p>
                          {selSubjects.length > 1 && (
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>{selSubjects.length} × R$ {PRICE_PER_SUBJ},00</p>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Favorecido</p>
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: '2px 0 0', fontWeight: 600, maxWidth: 150, textAlign: 'right' }}>{PIX_NAME}</p>
                        </div>
                      </div>
                      <CopyPixButton value={PIX_KEY} />
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8, textAlign: 'center' }}>Toque na chave para copiar e colar no seu app de pagamento</p>
                    </div>
                    <div style={card}>
                      <label style={labelStyle}>Comprovante de pagamento</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: attachFile ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)', border: `2px dashed ${attachFile ? '#22c55e' : 'rgba(64,84,178,0.3)'}`, borderRadius: 14, padding: '16px', transition: 'all 0.2s', minHeight: 60 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: attachFile ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Upload style={{ width: 18, height: 18, color: attachFile ? '#4ade80' : 'rgba(255,255,255,0.35)' }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: attachFile ? '#86efac' : 'rgba(255,255,255,0.5)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {attachFile ? attachFile.name : 'Anexar comprovante'}
                          </p>
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>
                            {attachFile ? 'Toque para trocar o arquivo' : 'PDF ou imagem da tela de pagamento'}
                          </p>
                        </div>
                        <input type="file" accept="image/*,.pdf" onChange={e => setAttachFile(e.target.files?.[0] ?? null)} style={{ display: 'none' }} />
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SIM justificada → motivo */}
              <AnimatePresence>
                {isJustified === true && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={card}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'white', margin: '0 0 14px' }}>Qual o motivo?</p>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => { setJustReason('doenca'); setLutoText(''); setAutorizacaoText(''); setAttachFile(null) }} style={choiceBtn(justReason === 'doenca', '#3b82f6')}>
                          <FileText style={{ width: 22, height: 22, color: justReason === 'doenca' ? '#60a5fa' : 'rgba(255,255,255,0.25)' }} />
                          <span>Doença</span><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>atestado médico</span>
                        </button>
                        <button onClick={() => { setJustReason('luto'); setAutorizacaoText(''); setAttachFile(null) }} style={choiceBtn(justReason === 'luto', '#8b5cf6')}>
                          <Heart style={{ width: 22, height: 22, color: justReason === 'luto' ? '#a78bfa' : 'rgba(255,255,255,0.25)' }} />
                          <span>Luto</span><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>perda familiar</span>
                        </button>
                        <button onClick={() => { setJustReason('autorizacao'); setLutoText(''); setAttachFile(null) }} style={choiceBtn(justReason === 'autorizacao', '#10b981')}>
                          <CheckCircle style={{ width: 22, height: 22, color: justReason === 'autorizacao' ? '#4ade80' : 'rgba(255,255,255,0.25)' }} />
                          <span>Autorizado</span><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>autorização coordenação</span>
                        </button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {justReason === 'doenca' && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={card}>
                          <label style={labelStyle}>Atestado médico</label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: attachFile ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)', border: `2px dashed ${attachFile ? '#22c55e' : 'rgba(59,130,246,0.3)'}`, borderRadius: 14, padding: '16px', transition: 'all 0.2s', minHeight: 60 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: attachFile ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Upload style={{ width: 18, height: 18, color: attachFile ? '#4ade80' : 'rgba(255,255,255,0.35)' }} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: 14, fontWeight: 600, color: attachFile ? '#86efac' : 'rgba(255,255,255,0.5)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {attachFile ? attachFile.name : 'Anexar atestado'}
                              </p>
                              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>PDF ou foto do atestado médico</p>
                            </div>
                            <input type="file" accept="image/*,.pdf" onChange={e => setAttachFile(e.target.files?.[0] ?? null)} style={{ display: 'none' }} />
                          </label>
                          {!attachFile && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginTop: 8 }}>Obrigatório para justificativas por doença.</p>}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <AnimatePresence>
                      {justReason === 'luto' && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={card}>
                          <label style={labelStyle}>Descreva o que aconteceu</label>
                          <textarea value={lutoText} onChange={e => setLutoText(e.target.value)} placeholder="Explique brevemente a situação..." rows={4}
                            style={{ ...inputBase, padding: '14px 16px', fontSize: 15, resize: 'none' }}
                            onFocus={e => { e.target.style.borderColor = '#8b5cf6'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.15)' }}
                            onBlur={e  => { e.target.style.borderColor = 'rgba(64,84,178,0.2)'; e.target.style.boxShadow = 'none' }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                            <p style={{ fontSize: 12, color: lutoText.trim().length > 10 ? '#4ade80' : 'rgba(255,255,255,0.25)', margin: 0 }}>
                              {lutoText.trim().length > 10 ? '✓ Descrição suficiente' : 'Mínimo de 10 caracteres'}
                            </p>
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 }}>{lutoText.length}</p>
                          </div>
                        </motion.div>
                      )}
                      {justReason === 'autorizacao' && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={card}>
                          <label style={labelStyle}>Explique a autorização da coordenação</label>
                          <textarea value={autorizacaoText} onChange={e => setAutorizacaoText(e.target.value)} placeholder="Descreva o motivo da autorização recebida..." rows={4}
                            style={{ ...inputBase, padding: '14px 16px', fontSize: 15, resize: 'none' }}
                            onFocus={e => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.15)' }}
                            onBlur={e  => { e.target.style.borderColor = 'rgba(64,84,178,0.2)'; e.target.style.boxShadow = 'none' }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                            <p style={{ fontSize: 12, color: autorizacaoText.trim().length > 10 ? '#4ade80' : 'rgba(255,255,255,0.25)', margin: 0 }}>
                              {autorizacaoText.trim().length > 10 ? '✓ Descrição suficiente' : 'Mínimo de 10 caracteres'}
                            </p>
                            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 }}>{autorizacaoText.length}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <motion.button onClick={() => goTo(1)} whileTap={{ scale: 0.97 }} style={btnBack}>
                  <ArrowLeft style={{ width: 16, height: 16 }} />Voltar
                </motion.button>
                <motion.button disabled={!step2Ok()} onClick={() => goTo(3)} whileTap={{ scale: step2Ok() ? 0.97 : 1 }}
                  style={{ ...btnPrimary(!step2Ok()), flex: 2 }}>
                  Continuar <ArrowRight style={{ width: 18, height: 18 }} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 3 — Dados
          ══════════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <motion.div key="s3" custom={dir} variants={slide} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.28, ease: [0.22,1,0.36,1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Resumo compacto */}
              <div style={{ background: 'rgba(64,84,178,0.1)', border: '1px solid rgba(64,84,178,0.2)', borderRadius: 14, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <ClipboardList style={{ width: 15, height: 15, color: '#6b7fe8', flexShrink: 0 }} />
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'white', margin: 0 }}>{selGrade}</p>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isJustified ? '#86efac' : '#fca5a5', background: isJustified ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', padding: '2px 8px', borderRadius: 5 }}>
                    {isJustified ? (justReason === 'doenca' ? '✔ Doença' : '✔ Luto') : '✘ Não justificada'}
                  </span>
                </div>
                {Object.entries(selectedSlots).map(([subject, slot]) => (
                  <div key={subject} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderTop: '1px solid rgba(64,84,178,0.12)' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#a0aff8' }}>{subject}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>
                      {formatDateShort(slot.date)} · {slot.startTime}–{slot.endTime}
                    </span>
                  </div>
                ))}
              </div>

              {/* Formulário */}
              <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Seu nome completo', value: parentName,  set: setParentName,  icon: User,          placeholder: 'Nome do responsável', type: 'text' },
                  { label: 'E-mail',            value: parentEmail, set: setParentEmail, icon: Mail,          placeholder: 'seu@email.com',       type: 'email' },
                  { label: 'WhatsApp',          value: parentPhone, set: (v: string) => setParentPhone(maskPhoneBr(v)), icon: Phone, placeholder: '(86) 99999-9999', type: 'tel' },
                  { label: 'Nome do aluno',     value: studentName, set: setStudentName, icon: GraduationCap, placeholder: 'Nome do seu filho(a)', type: 'text' },
                ].map(field => (
                  <div key={field.label}>
                    <label style={labelStyle}>{field.label}</label>
                    <div style={{ position: 'relative' }}>
                      <field.icon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 17, height: 17, color: 'rgba(255,255,255,0.28)', pointerEvents: 'none' }} />
                      <input type={field.type} inputMode={field.type === 'tel' ? 'numeric' : field.type === 'email' ? 'email' : 'text'}
                        autoComplete={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'name'}
                        value={field.value} onChange={e => field.set(e.target.value)} placeholder={field.placeholder}
                        style={{ ...inputBase, paddingLeft: 46 }}
                        onFocus={e => { e.target.style.borderColor = '#4054B2'; e.target.style.boxShadow = '0 0 0 3px rgba(64,84,178,0.15)'; e.target.style.background = 'rgba(255,255,255,0.09)' }}
                        onBlur={e  => { e.target.style.borderColor = 'rgba(64,84,178,0.2)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(255,255,255,0.06)' }} />
                    </div>
                  </div>
                ))}
              </div>

              {submitError && (
                <div style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)', color: '#fca5a5', padding: '14px 16px', borderRadius: 12, fontSize: 14 }}>
                  {submitError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <motion.button onClick={() => goTo(2)} whileTap={{ scale: 0.97 }} style={btnBack}>
                  <ArrowLeft style={{ width: 16, height: 16 }} />Voltar
                </motion.button>
                <motion.button disabled={submitting || !formOk} onClick={handleSubmit} whileTap={{ scale: formOk && !submitting ? 0.97 : 1 }}
                  style={{ ...btnPrimary(!formOk || submitting), flex: 2 }}>
                  {submitting
                    ? <><div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin .7s linear infinite' }} />
                        {uploadingFile ? 'Enviando arquivo...' : 'Confirmando...'}</>
                    : <><Check style={{ width: 18, height: 18 }} />Confirmar inscrição</>}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 4 — Sucesso
          ══════════════════════════════════════════════════════════════════ */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center', paddingTop: 16 }}>

              <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
                style={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg,#4054B2,#6b7fe8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 60px rgba(64,84,178,0.45)' }}>
                <CheckCircle style={{ width: 46, height: 46, color: 'white' }} />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h2 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 900, fontSize: 30, color: 'white', margin: 0 }}>Inscrito!</h2>
                <p style={{ color: 'rgba(255,255,255,0.42)', marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
                  Confirmação enviada para<br />
                  <strong style={{ color: 'rgba(255,255,255,0.75)' }}>{parentEmail}</strong>
                </p>
              </motion.div>

              {/* Resumo das inscrições */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(64,84,178,0.2)', borderRadius: 18, padding: '18px 16px' }}>
                {[
                  { label: 'Aluno',  value: studentName },
                  { label: 'Série',  value: selGrade },
                  { label: 'Situação', value: isJustified ? (justReason === 'doenca' ? 'Justificada — Doença' : 'Justificada — Luto') : `Não justificada · ${pixValueStr} via PIX` },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, flexShrink: 0 }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, textAlign: 'right', color: 'rgba(255,255,255,0.75)' }}>{item.value}</span>
                  </div>
                ))}
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>
                  {Object.keys(selectedSlots).length} inscrição{Object.keys(selectedSlots).length > 1 ? 'ões' : ''}
                </p>
                {Object.entries(selectedSlots).map(([subject, slot]) => (
                  <div key={subject} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#6b7fe8' }}>{subject}</span>
                    <span style={{ fontSize: 12, color: '#a0aff8', fontWeight: 600, textAlign: 'right', textTransform: 'capitalize' }}>
                      {formatDate(slot.date)}<br />
                      <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>{slot.startTime} – {slot.endTime}</span>
                    </span>
                  </div>
                ))}
              </motion.div>

              {/* Botões de agenda — um por disciplina */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(selectedSlots).map(([subject, slot]) => (
                  <a key={subject}
                    href={generateCalendarLink({
                      title: `Segunda Chamada — ${subject}`,
                      date: slot.date,
                      startTime: slot.startTime,
                      endTime: slot.endTime,
                      description: `Segunda chamada de ${subject}\nAluno: ${studentName}\nTurma: ${buildStudentGrade(selGrade, selTurma)}`,
                    })}
                    target="_blank" rel="noopener noreferrer"
                    style={{ textDecoration: 'none', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.15)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                      <CalendarPlus style={{ width: 18, height: 18, color: '#6b7fe8' }} />
                      {Object.keys(selectedSlots).length > 1 ? `Google Agenda — ${subject}` : 'Adicionar ao Google Agenda'}
                    </div>
                  </a>
                ))}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                style={{ width: '100%', background: 'rgba(64,84,178,0.08)', border: '1px solid rgba(64,84,178,0.2)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left' }}>
                <MapPin style={{ width: 16, height: 16, color: '#6b7fe8', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: 0 }}>Grupo Educacional Pro Campus</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0', lineHeight: 1.4 }}>
                    Apresente-se com documento com foto e 10 minutos de antecedência.
                  </p>
                </div>
              </motion.div>

              <Link href="/" style={{ textDecoration: 'none' }}>
                <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontWeight: 500, fontSize: 14, cursor: 'pointer', padding: '8px 16px' }}>
                  ← Voltar para o início
                </button>
              </Link>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { -webkit-tap-highlight-color: transparent; }
        input, select, textarea, button { font-family: inherit; }
        ::placeholder { color: rgba(255,255,255,0.25); }
        select option { background: #08091a; }
      `}</style>
    </div>
  )
}
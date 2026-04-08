// app/recuperacao/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Check, BookMarked,
  User, Mail, Phone, GraduationCap, CheckCircle,
  ChevronDown, MapPin, CalendarDays, Clock, Copy, Upload, CalendarPlus,
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

const PIX_KEY   = 'financeiro@procampus.com.br'
const PIX_NAME  = 'SOCIEDADE EDUCACIONAL DO PIAUI S/S LTDA'
const MAX_SUBJECTS = 4
const PRICE_PER_SUBJECT = 30

type RecoverySchedule = {
  id: string; subjectName: string; grade: string; type: string; period?: string | null
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

// ── Botão copiar chave PIX ────────────────────────────────────────────────────
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

// ── Indicador de steps ────────────────────────────────────────────────────────
function Steps({ current, isParalela }: { current: number; isParalela: boolean }) {
  const labels = isParalela ? ['Prova', 'Dados'] : ['Prova', 'Pagamento', 'Dados']
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
      {labels.map((label, i) => {
        const n = i + 1; const done = current > n; const active = current === n
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: done || active ? '#23A455' : 'rgba(255,255,255,0.08)', color: done || active ? 'white' : 'rgba(255,255,255,0.3)', border: done || active ? 'none' : '1.5px solid rgba(255,255,255,0.12)' }}>
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

export default function RecuperacaoPage() {
  const [step, setStep] = useState(1)
  const [dir,  setDir]  = useState(1)
  function goTo(next: number) { setDir(next > step ? 1 : -1); setStep(next) }

  // Step 1
  const [selGrade,      setSelGrade]      = useState('')
  const [selTurma,      setSelTurma]      = useState('')
  const [allSubjects,   setAllSubjects]   = useState<string[]>([])
  const [selSubjectsP,  setSelSubjectsP]  = useState<string[]>([])            // selected subjects (both fund1 & fund2)
  const [schedules,     setSchedules]     = useState<RecoverySchedule[]>([])  // all fetched slots for grade+type
  const [loadingSlots,  setLoadingSlots]  = useState(false)
  const [hasSearched,   setHasSearched]   = useState(false)
  const [selectedSlots, setSelectedSlots] = useState<Record<string, RecoverySchedule>>({}) // subjectName → slot
  const turmasDisponiveis = getTurmas(selGrade)

  const isFund1    = GRADES_FUND1.has(selGrade)
  const isParalela = !isFund1

  // Fluxo: Paralela → 1→2(dados)→3(sucesso) | Normal → 1→2(pix)→3(dados)→4(sucesso)
  const dataStep    = isParalela ? 2 : 3
  const successStep = isParalela ? 3 : 4

  // PIX dinâmico — R$30 por disciplina selecionada
  const pixAmount   = selSubjectsP.length * PRICE_PER_SUBJECT
  const pixValueStr = `R$ ${pixAmount},00`

  // Todos os slots selecionados?
  const allSlotsChosen = selSubjectsP.length > 0 && selSubjectsP.every(s => !!selectedSlots[s])

  // Step 2 — PIX (só normal)
  const [pixFile,       setPixFile]       = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)

  // Step dados
  const [parentName,  setParentName]  = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [studentName, setStudentName] = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Reset ao trocar série
  useEffect(() => {
    setAllSubjects([]); setSelSubjectsP([]); setSchedules([])
    setSelectedSlots({}); setHasSearched(false); setSelTurma('')
    if (!selGrade) return
    ;(async () => {
      try {
        const res = await fetch(`/api/disciplinas?grade=${encodeURIComponent(selGrade)}`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        setAllSubjects([...new Set(data.map((s: any) => s.name) as string[])])
      } catch { setAllSubjects([]) }
    })()
  }, [selGrade])

  // Limpar slots de disciplinas removidas da seleção
  useEffect(() => {
    setSelectedSlots(prev => {
      const next: Record<string, RecoverySchedule> = {}
      selSubjectsP.forEach(s => { if (prev[s]) next[s] = prev[s] })
      return next
    })
  }, [selSubjectsP])

  async function loadSlots() {
    if (!selGrade || selSubjectsP.length === 0) return
    setLoadingSlots(true); setHasSearched(true)
    try {
      const type = isFund1 ? 'normal' : 'paralela'
      const res = await fetch(`/api/recuperacao?public=true&grade=${encodeURIComponent(selGrade)}&type=${type}`)
      const data = await res.json()
      setSchedules(Array.isArray(data) ? data : [])
    } catch { setSchedules([]) }
    finally { setLoadingSlots(false) }
  }

  function toggleSubject(s: string) {
    setSelSubjectsP(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : prev.length < MAX_SUBJECTS ? [...prev, s] : prev
    )
  }

  const formOk = parentName.trim().length > 3 && parentEmail.includes('@') && parentPhone.replace(/\D/g, '').length >= 10 && studentName.trim().length > 3
  const pixOk  = !!pixFile

  async function handleSubmit() {
    const entries = Object.entries(selectedSlots)
    if (!entries.length) return
    setSubmitting(true); setSubmitError('')
    try {
      let fileUrl: string | null = null
      if (pixFile) { setUploadingFile(true); fileUrl = await uploadToCloudinary(pixFile); setUploadingFile(false) }

      await Promise.all(
        entries.map(([subject, slot]) =>
          fetch(`/api/recuperacao/${slot.id}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              parentName, parentEmail, parentPhone, studentName,
              studentGrade: buildStudentGrade(selGrade, selTurma), subjects: subject, fileUrl,
            }),
          }).then(async r => {
            if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Erro ao inscrever.') }
          })
        )
      )
      goTo(successStep)
    } catch (err: any) { setSubmitError(err?.message || 'Erro de conexão.') }
    finally { setSubmitting(false); setUploadingFile(false) }
  }

  // ── Estilos base ────────────────────────────────────────────────────────────
  const card: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(35,164,85,0.2)', borderRadius: 18, padding: '18px 16px' }
  const inputBase: React.CSSProperties = { width: '100%', padding: '14px 16px', borderRadius: 14, border: '1.5px solid rgba(35,164,85,0.2)', background: 'rgba(255,255,255,0.06)', color: 'white', fontSize: 16, outline: 'none', fontFamily: 'inherit', transition: 'all 0.2s', boxSizing: 'border-box' as const, WebkitAppearance: 'none' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }
  const btnPrimary = (disabled = false): React.CSSProperties => ({ width: '100%', padding: '17px 16px', borderRadius: 14, border: 'none', background: disabled ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#23A455,#61CE70)', color: disabled ? 'rgba(255,255,255,0.2)' : '#041809', fontSize: 16, fontWeight: 800, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: '"Roboto Slab",serif', boxShadow: disabled ? 'none' : '0 8px 30px rgba(35,164,85,0.35)', transition: 'all 0.3s', minHeight: 54 })
  const btnBack: React.CSSProperties = { flex: 1, padding: '16px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 54 }

  return (
    <div style={{ minHeight: '100vh', background: '#030d06', overscrollBehavior: 'none' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(3,13,6,0.96)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(35,164,85,0.15)', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
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
        {step < successStep && (
          <div style={{ padding: '10px 16px 12px', maxWidth: 520, margin: '0 auto' }}>
            <Steps current={step} isParalela={isParalela} />
          </div>
        )}
      </div>

      <div style={{ height: step < successStep ? 100 : 52 }} />

      <main style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px 40px', paddingBottom: 'max(40px, calc(env(safe-area-inset-bottom, 0px) + 24px))' }}>

        {/* Título da etapa */}
        {step < successStep && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20, textAlign: 'center' }}>
            <h1 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 900, fontSize: 24, color: 'white', margin: 0 }}>
              {step === 1 ? 'Recuperação' : step === 2 && !isParalela ? '💰 Pagamento' : 'Seus dados'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.35)', marginTop: 6, fontSize: 14, lineHeight: 1.4 }}>
              {step === 1
                ? 'Escolha as disciplinas e os horários'
                : step === 2 && !isParalela
                  ? 'Realize o pagamento e anexe o comprovante'
                  : 'Preencha para confirmar a inscrição'}
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="wait" custom={dir}>

          {/* ══════════════════════════════════════════════════════════════════
              STEP 1 — Escolha da prova
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
                    <option value="" style={{ background: '#030d06' }}>Selecione a série</option>
                    {ALL_GRADES.map(g => <option key={g} value={g} style={{ background: '#030d06' }}>{g}</option>)}
                  </select>
                  <ChevronDown style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Seletor de turma */}
              <AnimatePresence>
                {selGrade && turmasDisponiveis.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={card}>
                    <label style={labelStyle}>Turma do aluno</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {turmasDisponiveis.map(t => (
                        <button key={t} onClick={() => setSelTurma(t)}
                          style={{ padding: '11px 18px', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', minHeight: 44,
                            background: selTurma === t ? 'linear-gradient(135deg,#23A455,#61CE70)' : 'rgba(255,255,255,0.06)',
                            color: selTurma === t ? '#041809' : 'rgba(255,255,255,0.65)',
                            border: selTurma === t ? '2px solid transparent' : '1.5px solid rgba(35,164,85,0.2)',
                            boxShadow: selTurma === t ? '0 4px 20px rgba(35,164,85,0.35)' : 'none' }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Badge tipo */}
              <AnimatePresence>
                {selGrade && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ padding: '12px 16px', borderRadius: 14, background: isFund1 ? 'rgba(245,158,11,0.12)' : 'rgba(35,164,85,0.12)', border: `1px solid ${isFund1 ? 'rgba(245,158,11,0.3)' : 'rgba(35,164,85,0.3)'}` }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: isFund1 ? '#fbbf24' : '#4ade80' }}>
                      {isFund1
                        ? selSubjectsP.length > 0
                          ? `💰 Recuperação Normal — R$ ${selSubjectsP.length * PRICE_PER_SUBJECT},00 (${selSubjectsP.length} disciplina${selSubjectsP.length > 1 ? 's' : ''})`
                          : `💰 Recuperação Normal — R$ ${PRICE_PER_SUBJECT},00 por disciplina`
                        : '✅ Recuperação Paralela — Gratuita'}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
                      {isFund1
                        ? `Selecione até ${MAX_SUBJECTS} disciplinas. Cada uma custa R$ ${PRICE_PER_SUBJECT},00 via PIX.`
                        : `Você pode selecionar até ${MAX_SUBJECTS} disciplinas para recuperação.`}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Disciplinas — ambos fund1 e fund2 */}
              <AnimatePresence>
                {selGrade && allSubjects.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={card}>
                    <label style={labelStyle}>
                      Disciplinas em recuperação
                      <span style={{ marginLeft: 6, color: selSubjectsP.length === MAX_SUBJECTS ? '#4ade80' : 'rgba(255,255,255,0.35)', fontWeight: 400, textTransform: 'none' }}>
                        ({selSubjectsP.length}/{MAX_SUBJECTS})
                      </span>
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {allSubjects.map(s => {
                        const checked  = selSubjectsP.includes(s)
                        const disabled = !checked && selSubjectsP.length >= MAX_SUBJECTS
                        return (
                          <button key={s} onClick={() => !disabled && toggleSubject(s)}
                            style={{ padding: '10px 14px', borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s', minHeight: 44, opacity: disabled ? 0.4 : 1, background: checked ? 'linear-gradient(135deg,#23A455,#61CE70)' : 'rgba(255,255,255,0.06)', color: checked ? '#041809' : 'rgba(255,255,255,0.65)', border: checked ? '2px solid transparent' : '1.5px solid rgba(35,164,85,0.2)', boxShadow: checked ? '0 4px 20px rgba(35,164,85,0.35)' : 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {checked && <Check style={{ width: 13, height: 13 }} />}{s}
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Buscar horários */}
              <AnimatePresence>
                {selGrade && selTurma && selSubjectsP.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <button onClick={loadSlots} style={btnPrimary(false)}>
                      <BookMarked style={{ width: 18, height: 18 }} />Ver horários disponíveis
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {loadingSlots && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 28 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid rgba(35,164,85,0.2)', borderTopColor: '#23A455', animation: 'spin .7s linear infinite' }} />
                </div>
              )}

              {/* ── Slots agrupados por disciplina ── */}
              {!loadingSlots && hasSearched && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {selSubjectsP.map(subject => {
                    const subjectSlots = schedules.filter(s => s.subjectName === subject)
                    const chosen = selectedSlots[subject]
                    return (
                      <div key={subject}>
                        {/* Cabeçalho da disciplina */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <div style={{ flex: 1, height: 1, background: 'rgba(35,164,85,0.15)' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: chosen ? '#4ade80' : 'rgba(255,255,255,0.55)' }}>{subject}</span>
                            {chosen && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#4ade80', background: 'rgba(35,164,85,0.15)', padding: '2px 8px', borderRadius: 100 }}>
                                <Check style={{ width: 10, height: 10 }} />Selecionado
                              </span>
                            )}
                          </div>
                          <div style={{ flex: 1, height: 1, background: 'rgba(35,164,85,0.15)' }} />
                        </div>

                        {subjectSlots.length === 0 ? (
                          <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Nenhum horário disponível para {subject}.</p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {subjectSlots.map(slot => {
                              const isSel = chosen?.id === slot.id
                              const periodLabel = slot.period === 'meio' ? 'Meio do Ano' : slot.period === 'final' ? 'Final do Ano' : ''
                              return (
                                <motion.button key={slot.id} onClick={() => setSelectedSlots(prev => ({ ...prev, [subject]: slot }))} whileTap={{ scale: 0.98 }}
                                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s', minHeight: 68, background: isSel ? 'rgba(35,164,85,0.2)' : 'rgba(255,255,255,0.04)', border: isSel ? '2px solid rgba(35,164,85,0.6)' : '1.5px solid rgba(35,164,85,0.12)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: isSel ? 'rgba(35,164,85,0.35)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <CalendarDays style={{ width: 17, height: 17, color: isSel ? '#4ade80' : 'rgba(255,255,255,0.35)' }} />
                                    </div>
                                    <div>
                                      <p style={{ fontWeight: 700, fontSize: 14, color: 'white', margin: 0, textTransform: 'capitalize' }}>{formatDate(slot.date)}</p>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                                        <p style={{ fontSize: 13, margin: 0, display: 'flex', alignItems: 'center', gap: 4, color: isSel ? '#86efac' : 'rgba(255,255,255,0.38)' }}>
                                          <Clock style={{ width: 12, height: 12 }} />{slot.startTime} – {slot.endTime}
                                        </p>
                                        {periodLabel && <span style={{ fontSize: 11, color: '#fbbf24', fontWeight: 600 }}>{periodLabel}</span>}
                                      </div>
                                    </div>
                                  </div>
                                  {isSel
                                    ? <Check style={{ width: 20, height: 20, color: '#4ade80', flexShrink: 0 }} />
                                    : <ArrowRight style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.18)', flexShrink: 0 }} />}
                                </motion.button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Progresso de seleção */}
                  {selSubjectsP.length > 1 && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                        {Object.keys(selectedSlots).length} de {selSubjectsP.length} horários escolhidos
                      </span>
                      {allSlotsChosen && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle style={{ width: 13, height: 13 }} />Tudo pronto
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {!loadingSlots && hasSearched && schedules.length === 0 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14, padding: '16px 0' }}>
                  Nenhum horário disponível no momento.
                </motion.p>
              )}

              <motion.button disabled={!allSlotsChosen} onClick={() => goTo(2)} whileTap={{ scale: allSlotsChosen ? 0.98 : 1 }} style={btnPrimary(!allSlotsChosen)}>
                Continuar <ArrowRight style={{ width: 18, height: 18 }} />
              </motion.button>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 2 — PIX (só recuperação normal / Fund1)
          ══════════════════════════════════════════════════════════════════ */}
          {step === 2 && !isParalela && (
            <motion.div key="s2pix" custom={dir} variants={slide} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.28, ease: [0.22,1,0.36,1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Resumo das provas selecionadas */}
              {Object.keys(selectedSlots).length > 0 && (
                <div style={{ background: 'rgba(35,164,85,0.1)', border: '1px solid rgba(35,164,85,0.25)', borderRadius: 14, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <BookMarked style={{ width: 15, height: 15, color: '#4ade80', flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{selGrade}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', background: 'rgba(245,158,11,0.15)', padding: '2px 8px', borderRadius: 5 }}>
                      {selSubjectsP.length} disciplina{selSubjectsP.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  {Object.entries(selectedSlots).map(([subject, slot]) => (
                    <div key={subject} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{subject}</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>
                        {formatDateShort(slot.date)} · {slot.startTime}–{slot.endTime}
                        {slot.period === 'meio' ? ' · Meio' : slot.period === 'final' ? ' · Final' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Card PIX */}
              <div style={{ ...card, borderColor: 'rgba(249,115,22,0.3)', background: 'rgba(249,115,22,0.06)' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#fb923c', margin: '0 0 4px' }}>💸 Taxa de recuperação</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 16px', lineHeight: 1.5 }}>
                  {selSubjectsP.length > 1
                    ? `${selSubjectsP.length} disciplinas × R$ ${PRICE_PER_SUBJECT},00 = ${pixValueStr}. Realize o pagamento via PIX e anexe o comprovante.`
                    : `Realize o pagamento via PIX e anexe o comprovante para continuar.`}
                </p>

                {/* Valor + favorecido */}
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Valor total</p>
                    <p style={{ fontSize: 26, fontWeight: 900, color: '#4ade80', margin: '2px 0 0', fontFamily: '"Roboto Slab",serif' }}>{pixValueStr}</p>
                    {selSubjectsP.length > 1 && (
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>
                        {selSubjectsP.length} × R$ {PRICE_PER_SUBJECT},00
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Favorecido</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: '2px 0 0', fontWeight: 600, maxWidth: 160, textAlign: 'right' }}>{PIX_NAME}</p>
                  </div>
                </div>

                {/* Botão copiar chave */}
                <CopyPixButton value={PIX_KEY} />
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8, textAlign: 'center' }}>
                  Toque na chave para copiar e colar no seu app de pagamento
                </p>
              </div>

              {/* Upload do comprovante */}
              <div style={card}>
                <label style={labelStyle}>Comprovante de pagamento</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: pixFile ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)', border: `2px dashed ${pixFile ? '#22c55e' : 'rgba(35,164,85,0.3)'}`, borderRadius: 14, padding: '16px', transition: 'all 0.2s', minHeight: 60 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: pixFile ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Upload style={{ width: 18, height: 18, color: pixFile ? '#4ade80' : 'rgba(255,255,255,0.35)' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: pixFile ? '#86efac' : 'rgba(255,255,255,0.5)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pixFile ? pixFile.name : 'Anexar comprovante'}
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0' }}>
                      {pixFile ? 'Toque para trocar o arquivo' : 'PDF ou imagem da tela de pagamento'}
                    </p>
                  </div>
                  <input type="file" accept="image/*,.pdf" onChange={e => setPixFile(e.target.files?.[0] ?? null)} style={{ display: 'none' }} />
                </label>
                {!pixFile && (
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginTop: 8 }}>
                    O comprovante é obrigatório para prosseguir.
                  </p>
                )}
              </div>

              {/* Botões */}
              <div style={{ display: 'flex', gap: 10 }}>
                <motion.button onClick={() => goTo(1)} whileTap={{ scale: 0.97 }} style={btnBack}>
                  <ArrowLeft style={{ width: 16, height: 16 }} />Voltar
                </motion.button>
                <motion.button disabled={!pixOk} onClick={() => goTo(3)} whileTap={{ scale: pixOk ? 0.97 : 1 }}
                  style={{ ...btnPrimary(!pixOk), flex: 2 }}>
                  Continuar <ArrowRight style={{ width: 18, height: 18 }} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP dados (step 2 para paralela, step 3 para normal)
          ══════════════════════════════════════════════════════════════════ */}
          {step === dataStep && (
            <motion.div key="sdata" custom={dir} variants={slide} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.28, ease: [0.22,1,0.36,1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Resumo */}
              <div style={{ background: 'rgba(35,164,85,0.1)', border: '1px solid rgba(35,164,85,0.2)', borderRadius: 14, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <BookMarked style={{ width: 15, height: 15, color: '#4ade80', flexShrink: 0 }} />
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'white', margin: 0 }}>{selGrade}</p>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isFund1 ? '#fbbf24' : '#4ade80', background: isFund1 ? 'rgba(245,158,11,0.15)' : 'rgba(35,164,85,0.15)', padding: '2px 8px', borderRadius: 5 }}>
                    {isFund1 ? `💰 Normal · ${pixValueStr}` : '✅ Paralela'}
                  </span>
                </div>
                {/* Lista de disciplinas + slots */}
                {Object.entries(selectedSlots).map(([subject, slot]) => (
                  <div key={subject} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: 12, color: isFund1 ? '#fbbf24' : '#4ade80', fontWeight: 600 }}>{subject}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>
                      {formatDateShort(slot.date)} · {slot.startTime}–{slot.endTime}
                    </span>
                  </div>
                ))}
                {/* Comprovante já enviado — confirmação visual */}
                {isFund1 && pixFile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 10px', background: 'rgba(34,197,94,0.1)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.2)' }}>
                    <Check style={{ width: 13, height: 13, color: '#4ade80' }} />
                    <p style={{ margin: 0, fontSize: 12, color: '#86efac', fontWeight: 600 }}>Comprovante anexado</p>
                  </div>
                )}
              </div>

              {/* Formulário de dados */}
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
                      <input
                        type={field.type}
                        inputMode={field.type === 'tel' ? 'numeric' : field.type === 'email' ? 'email' : 'text'}
                        autoComplete={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'name'}
                        value={field.value}
                        onChange={e => field.set(e.target.value)}
                        placeholder={field.placeholder}
                        style={{ ...inputBase, paddingLeft: 46 }}
                        onFocus={e => { e.target.style.borderColor = '#23A455'; e.target.style.boxShadow = '0 0 0 3px rgba(35,164,85,0.15)'; e.target.style.background = 'rgba(255,255,255,0.09)' }}
                        onBlur={e  => { e.target.style.borderColor = 'rgba(35,164,85,0.2)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(255,255,255,0.06)' }}
                      />
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
                <motion.button onClick={() => goTo(step - 1)} whileTap={{ scale: 0.97 }} style={btnBack}>
                  <ArrowLeft style={{ width: 16, height: 16 }} />Voltar
                </motion.button>
                <motion.button disabled={submitting || !formOk} onClick={handleSubmit} whileTap={{ scale: formOk && !submitting ? 0.97 : 1 }}
                  style={{ ...btnPrimary(!formOk || submitting), flex: 2 }}>
                  {submitting
                    ? <><div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#041809', animation: 'spin .7s linear infinite' }} />{uploadingFile ? 'Enviando...' : 'Confirmando...'}</>
                    : <><Check style={{ width: 18, height: 18 }} />Confirmar inscrição</>}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SUCESSO
          ══════════════════════════════════════════════════════════════════ */}
          {step === successStep && (
            <motion.div key="ssucc" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center', paddingTop: 16 }}>

              <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
                style={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg,#23A455,#61CE70)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 60px rgba(35,164,85,0.45)' }}>
                <CheckCircle style={{ width: 46, height: 46, color: '#041809' }} />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h2 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 900, fontSize: 30, color: 'white', margin: 0 }}>Inscrito!</h2>
                <p style={{ color: 'rgba(255,255,255,0.42)', marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
                  Confirmação enviada para<br />
                  <strong style={{ color: 'rgba(255,255,255,0.75)' }}>{parentEmail}</strong>
                </p>
              </motion.div>

              {/* Resumo de todas as inscrições */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(35,164,85,0.2)', borderRadius: 18, padding: '18px 16px' }}>
                {/* Info geral */}
                {[
                  { label: 'Aluno',   value: studentName },
                  { label: 'Série',   value: selGrade },
                  { label: 'Tipo',    value: isFund1 ? 'Recuperação Normal (paga)' : 'Recuperação Paralela (gratuita)' },
                  ...(isFund1 ? [{ label: 'Total pago', value: `${pixValueStr} via PIX ✅` }] : []),
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, flexShrink: 0 }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, textAlign: 'right', color: 'rgba(255,255,255,0.75)' }}>{item.value}</span>
                  </div>
                ))}
                {/* Disciplinas individuais */}
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>
                  {Object.keys(selectedSlots).length} inscrição{Object.keys(selectedSlots).length > 1 ? 'ões' : ''}
                </p>
                {Object.entries(selectedSlots).map(([subject, slot]) => (
                  <div key={subject} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: isFund1 ? '#fbbf24' : '#4ade80' }}>{subject}</span>
                    <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 600, textAlign: 'right', textTransform: 'capitalize' }}>
                      {formatDate(slot.date)}<br />
                      <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>{slot.startTime} – {slot.endTime}</span>
                    </span>
                  </div>
                ))}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(selectedSlots).map(([subject, slot]) => (
                  <motion.a key={subject}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                    href={generateCalendarLink({
                      title: `Recuperação — ${subject}`,
                      date: slot.date,
                      startTime: slot.startTime,
                      endTime: slot.endTime,
                      description: `Recuperação de ${subject}\nAluno: ${studentName}\nTurma: ${buildStudentGrade(selGrade, selTurma)}`,
                    })}
                    target="_blank" rel="noopener noreferrer"
                    style={{ textDecoration: 'none', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.15)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                      <CalendarPlus style={{ width: 18, height: 18, color: '#4ade80' }} />
                      {Object.keys(selectedSlots).length > 1 ? `Google Agenda — ${subject}` : 'Adicionar ao Google Agenda'}
                    </div>
                  </motion.a>
                ))}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                style={{ width: '100%', background: 'rgba(35,164,85,0.08)', border: '1px solid rgba(35,164,85,0.2)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left' }}>
                <MapPin style={{ width: 16, height: 16, color: '#4ade80', flexShrink: 0, marginTop: 1 }} />
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
        select option { background: #030d06; }
      `}</style>
    </div>
  )
}
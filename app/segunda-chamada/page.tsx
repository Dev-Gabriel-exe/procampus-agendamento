// app/segunda-chamada/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Check, ClipboardList,
  User, Mail, Phone, GraduationCap, CheckCircle,
  ChevronDown, MapPin, CalendarDays, Clock
} from 'lucide-react'

const GRADES_FUND1 = ['Educação Infantil','1º Ano Fundamental','2º Ano Fundamental','3º Ano Fundamental','4º Ano Fundamental','5º Ano Fundamental']
const GRADES_FUND2 = ['6º Ano Fundamental','7º Ano Fundamental','8º Ano Fundamental','9º Ano Fundamental','1ª Série Médio','2ª Série Médio','3ª Série Médio']
const ALL_GRADES   = [...GRADES_FUND1, ...GRADES_FUND2]

type ExamSchedule = { id: string; subjectName: string; grade: string; date: string; startTime: string; endTime: string; bookings: { id: string }[] }

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Fortaleza' })
}

function maskPhoneBr(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2)  return `(${d}`
  if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

const slide = {
  enter:  (d: number) => ({ opacity: 0, x: d > 0 ? 32 : -32 }),
  center: { opacity: 1, x: 0 },
  exit:   (d: number) => ({ opacity: 0, x: d > 0 ? -32 : 32 }),
}

function Steps({ current }: { current: number }) {
  const labels = ['Prova', 'Dados']
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28 }}>
      {labels.map((label, i) => {
        const n = i + 1; const done = current > n; const active = current === n
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: done || active ? '#4054B2' : 'rgba(255,255,255,0.08)', color: done || active ? 'white' : 'rgba(255,255,255,0.35)', border: done || active ? 'none' : '1.5px solid rgba(255,255,255,0.15)', flexShrink: 0 }}>
                {done ? <Check style={{ width: 13, height: 13 }} /> : n}
              </div>
              <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? 'white' : done ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>{label}</span>
            </div>
            {i < labels.length - 1 && <div style={{ width: 24, height: 1, background: 'rgba(255,255,255,0.12)', margin: '0 8px', flexShrink: 0 }} />}
          </div>
        )
      })}
    </div>
  )
}

export default function SegundaChamadaPage() {
  const [step, setStep] = useState(1)
  const [dir,  setDir]  = useState(1)
  function goTo(next: number) { setDir(next > step ? 1 : -1); setStep(next) }

  // Step 1
  const [selGrade,     setSelGrade]     = useState('')
  const [selSubject,   setSelSubject]   = useState('')
  const [allSubjects,  setAllSubjects]  = useState<string[]>([])
  const [exams,        setExams]        = useState<ExamSchedule[]>([])
  const [loadingExams, setLoadingExams] = useState(false)
  const [selectedExam, setSelectedExam] = useState<ExamSchedule | null>(null)

  // Step 2
  const [parentName,  setParentName]  = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [studentName, setStudentName] = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Carrega disciplinas da série
  useEffect(() => {
    if (!selGrade) { setAllSubjects([]); setSelSubject(''); setExams([]); setSelectedExam(null); return }
    fetch(`/api/disciplinas?grade=${encodeURIComponent(selGrade)}`)
      .then(r => r.json())
      .then(data => setAllSubjects([...new Set(data.map((s: any) => s.name) as string[])]))
  }, [selGrade])

  // Reset subject quando muda
  useEffect(() => { setSelSubject(''); setExams([]); setSelectedExam(null) }, [selGrade])

  async function loadExams() {
    if (!selGrade || !selSubject) return
    setLoadingExams(true)
    try {
      const res = await fetch(`/api/segunda-chamada?public=true&grade=${encodeURIComponent(selGrade)}&subject=${encodeURIComponent(selSubject)}`)
      const data = await res.json()
      setExams(Array.isArray(data) ? data : [])
    } catch { setExams([]) }
    finally { setLoadingExams(false) }
  }

  async function handleSubmit() {
    if (!selectedExam) return
    setSubmitting(true); setSubmitError('')
    try {
      const res = await fetch(`/api/segunda-chamada/${selectedExam.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentName, parentEmail, parentPhone, studentName, studentGrade: selGrade }),
      })
      if (!res.ok) { setSubmitError((await res.json()).error || 'Erro ao inscrever.'); return }
      goTo(3)
    } catch { setSubmitError('Erro de conexão.') }
    finally { setSubmitting(false) }
  }

  const formOk = parentName && parentEmail && parentPhone && studentName

  return (
    <div style={{ minHeight: '100vh', background: '#08091a' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(8,9,26,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(64,84,178,0.2)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              <ArrowLeft style={{ width: 14, height: 14 }} />Voltar
            </button>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Pro Campus" style={{ width: 28, height: 28, objectFit: 'contain' }} />
            <span style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 800, color: 'white', fontSize: 14 }}>Pro Campus</span>
          </div>
          <div style={{ width: 72 }} />
        </div>
        {step < 3 && (
          <div style={{ padding: '10px 20px 14px', maxWidth: 640, margin: '0 auto' }}>
            <Steps current={step} />
          </div>
        )}
      </div>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 60px' }}>
        {step < 3 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20, textAlign: 'center' }}>
            <h1 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 900, fontSize: 'clamp(22px,5vw,28px)', color: 'white', margin: 0 }}>
              {step === 1 ? 'Segunda Chamada' : 'Seus dados'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.38)', marginTop: 6, fontSize: 14 }}>
              {step === 1 ? 'Escolha a disciplina e o horário da prova' : 'Preencha para confirmar a inscrição'}
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="wait" custom={dir}>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <motion.div key="s1" custom={dir} variants={slide} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3, ease: [0.22,1,0.36,1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {/* Série */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(64,84,178,0.2)', borderRadius: 16, padding: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Série do aluno</label>
                <div style={{ position: 'relative' }}>
                  <select value={selGrade} onChange={e => setSelGrade(e.target.value)}
                    style={{ width: '100%', padding: '13px 44px 13px 16px', borderRadius: 12, border: '1.5px solid rgba(64,84,178,0.3)', background: 'rgba(255,255,255,0.06)', color: selGrade ? 'white' : 'rgba(255,255,255,0.35)', fontSize: 15, outline: 'none', appearance: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                    <option value="" style={{ background: '#08091a' }}>Selecione a série</option>
                    {ALL_GRADES.map(g => <option key={g} value={g} style={{ background: '#08091a' }}>{g}</option>)}
                  </select>
                  <ChevronDown style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Disciplina */}
              {selGrade && allSubjects.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(64,84,178,0.2)', borderRadius: 16, padding: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Disciplina</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {allSubjects.map(s => (
                      <button key={s} onClick={() => { setSelSubject(s); setExams([]); setSelectedExam(null) }}
                        style={{ padding: '10px 16px', borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', background: selSubject === s ? 'linear-gradient(135deg,#4054B2,#6b7fe8)' : 'rgba(255,255,255,0.06)', color: selSubject === s ? 'white' : 'rgba(255,255,255,0.7)', border: selSubject === s ? '2px solid transparent' : '1.5px solid rgba(64,84,178,0.25)', boxShadow: selSubject === s ? '0 4px 20px rgba(64,84,178,0.35)' : 'none' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {selGrade && allSubjects.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                  Nenhuma disciplina disponível para esta série.
                </div>
              )}

              {/* Buscar provas */}
              {selGrade && selSubject && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <button onClick={loadExams}
                    style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#4054B2,#6b7fe8)', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: '"Roboto Slab",serif', boxShadow: '0 6px 24px rgba(64,84,178,0.35)' }}>
                    <ClipboardList style={{ width: 17, height: 17 }} />Ver horários disponíveis
                  </button>
                </motion.div>
              )}

              {/* Loading */}
              {loadingExams && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid rgba(64,84,178,0.2)', borderTopColor: '#4054B2', animation: 'spin .7s linear infinite' }} />
                </div>
              )}

              {/* Lista de slots */}
              {!loadingExams && exams.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>
                    {exams.length} horário{exams.length !== 1 ? 's' : ''} disponível{exams.length !== 1 ? 'is' : ''}:
                  </p>
                  {exams.map(exam => {
                    const isSelected = selectedExam?.id === exam.id
                    return (
                      <button key={exam.id} onClick={() => setSelectedExam(exam)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s', background: isSelected ? 'rgba(64,84,178,0.2)' : 'rgba(255,255,255,0.04)', border: isSelected ? '1.5px solid rgba(64,84,178,0.6)' : '1.5px solid rgba(64,84,178,0.12)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: isSelected ? 'rgba(64,84,178,0.3)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <CalendarDays style={{ width: 17, height: 17, color: isSelected ? '#6b7fe8' : 'rgba(255,255,255,0.4)' }} />
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: 14, color: 'white', margin: 0, textTransform: 'capitalize' }}>{formatDate(exam.date)}</p>
                            <p style={{ fontSize: 13, color: isSelected ? '#a0aff8' : 'rgba(255,255,255,0.4)', margin: 0, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock style={{ width: 12, height: 12 }} />{exam.startTime} – {exam.endTime}
                            </p>
                          </div>
                        </div>
                        {isSelected ? <Check style={{ width: 18, height: 18, color: '#6b7fe8' }} /> : <ArrowRight style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.2)' }} />}
                      </button>
                    )
                  })}
                </motion.div>
              )}

              {!loadingExams && exams.length === 0 && selGrade && selSubject && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                  Nenhum horário disponível para esta disciplina.
                </div>
              )}

              <button disabled={!selectedExam} onClick={() => goTo(2)}
                style={{ width: '100%', padding: '16px', borderRadius: 14, border: 'none', background: selectedExam ? 'linear-gradient(135deg,#4054B2,#6b7fe8)' : 'rgba(255,255,255,0.06)', color: selectedExam ? 'white' : 'rgba(255,255,255,0.2)', fontSize: 16, fontWeight: 800, cursor: selectedExam ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: '"Roboto Slab",serif', boxShadow: selectedExam ? '0 8px 30px rgba(64,84,178,0.35)' : 'none', transition: 'all 0.3s' }}>
                Continuar <ArrowRight style={{ width: 18, height: 18 }} />
              </button>
            </motion.div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <motion.div key="s2" custom={dir} variants={slide} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3, ease: [0.22,1,0.36,1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {/* Resumo */}
              {selectedExam && (
                <div style={{ background: 'rgba(64,84,178,0.12)', border: '1px solid rgba(64,84,178,0.3)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(64,84,178,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ClipboardList style={{ width: 17, height: 17, color: '#6b7fe8' }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'white', margin: 0 }}>{selectedExam.subjectName} — {selGrade}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0, marginTop: 2, textTransform: 'capitalize' }}>
                      {formatDate(selectedExam.date)} · {selectedExam.startTime} – {selectedExam.endTime}
                    </p>
                  </div>
                </div>
              )}

              {/* Formulário */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(64,84,178,0.15)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Seu nome completo', value: parentName, onChange: setParentName, placeholder: 'Nome do responsável', icon: User },
                  { label: 'E-mail', value: parentEmail, onChange: setParentEmail, placeholder: 'seu@email.com', icon: Mail, type: 'email' },
                  { label: 'WhatsApp', value: parentPhone, onChange: (v: string) => setParentPhone(maskPhoneBr(v)), placeholder: '(86) 99999-9999', icon: Phone },
                  { label: 'Nome do aluno', value: studentName, onChange: setStudentName, placeholder: 'Nome do seu filho(a)', icon: GraduationCap },
                ].map(field => (
                  <div key={field.label}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{field.label}</label>
                    <div style={{ position: 'relative' }}>
                      <field.icon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                      <input type={(field as any).type || 'text'} value={field.value} onChange={e => field.onChange(e.target.value)} placeholder={field.placeholder}
                        style={{ width: '100%', paddingLeft: 42, paddingRight: 16, paddingTop: 12, paddingBottom: 12, borderRadius: 12, border: '1.5px solid rgba(64,84,178,0.2)', background: 'rgba(255,255,255,0.06)', color: 'white', fontSize: 14, outline: 'none', fontFamily: 'inherit', transition: 'all 0.2s' }}
                        onFocus={e => { e.target.style.borderColor = '#4054B2'; e.target.style.boxShadow = '0 0 0 3px rgba(64,84,178,0.15)' }}
                        onBlur={e  => { e.target.style.borderColor = 'rgba(64,84,178,0.2)'; e.target.style.boxShadow = 'none' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {submitError && (
                <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', color: '#fca5a5', padding: '12px 16px', borderRadius: 10, fontSize: 13 }}>
                  {submitError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => goTo(1)} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <ArrowLeft style={{ width: 16, height: 16 }} />Voltar
                </button>
                <button disabled={submitting || !formOk} onClick={handleSubmit}
                  style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', background: (formOk && !submitting) ? 'linear-gradient(135deg,#4054B2,#6b7fe8)' : 'rgba(255,255,255,0.06)', color: (formOk && !submitting) ? 'white' : 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: 800, cursor: (formOk && !submitting) ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: '"Roboto Slab",serif', transition: 'all 0.3s' }}>
                  {submitting ? <><div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin .7s linear infinite' }} />Confirmando...</> : <><Check style={{ width: 16, height: 16 }} />Confirmar inscrição</>}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3 — Sucesso ── */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}
            >
              <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 180, delay: 0.2 }}
                style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg,#4054B2,#6b7fe8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 60px rgba(64,84,178,0.45)', marginTop: 20 }}>
                <CheckCircle style={{ width: 44, height: 44, color: 'white' }} />
              </motion.div>

              <div>
                <h2 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 900, fontSize: 32, color: 'white', margin: 0 }}>Inscrito!</h2>
                <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: 8, fontSize: 14 }}>
                  Confirmação enviada para <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{parentEmail}</strong>
                </p>
              </div>

              {selectedExam && (
                <div style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(64,84,178,0.2)', borderRadius: 16, padding: 20, textAlign: 'left' }}>
                  {[
                    { label: 'Aluno',      value: studentName },
                    { label: 'Disciplina', value: `${selectedExam.subjectName} — ${selGrade}` },
                    { label: 'Data',       value: formatDate(selectedExam.date),               hl: true },
                    { label: 'Horário',    value: `${selectedExam.startTime} – ${selectedExam.endTime}`, hl: true },
                  ].map((item, i, arr) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: i < arr.length-1 ? 12 : 0, marginBottom: i < arr.length-1 ? 12 : 0, borderBottom: i < arr.length-1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: item.hl ? 700 : 500, color: item.hl ? '#6b7fe8' : 'rgba(255,255,255,0.8)', textAlign: 'right', textTransform: item.hl ? 'capitalize' as any : 'none' as any }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ width: '100%', background: 'rgba(64,84,178,0.08)', border: '1px solid rgba(64,84,178,0.2)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                <MapPin style={{ width: 15, height: 15, color: '#6b7fe8', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'white', margin: 0 }}>Grupo Educacional Pro Campus</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0, marginTop: 2 }}>Apresente-se com documento com foto e 10 min de antecedência.</p>
                </div>
              </div>

              <Link href="/" style={{ textDecoration: 'none' }}>
                <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontWeight: 500, fontSize: 14, cursor: 'pointer' }}>
                  ← Voltar para o início
                </button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
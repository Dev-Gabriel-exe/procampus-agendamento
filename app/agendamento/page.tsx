'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Check, CalendarDays,
  Clock, User, Mail, Phone, MessageSquare, GraduationCap,
  CheckCircle, ExternalLink, ChevronDown, MapPin, ChevronRight
} from 'lucide-react'
import StepIndicator  from '@/components/agendamento/StepIndicator'
import Input          from '@/components/ui/Input'
import Button         from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { generateCalendarLink } from '@/lib/calendar-link'
import { maskPhoneBr, isValidEmail } from '@/lib/masks'
import type { AvailableSlot } from '@/types'

const GRADES = [
  'Educação Infantil',
  '1º Ano Fundamental','2º Ano Fundamental','3º Ano Fundamental',
  '4º Ano Fundamental','5º Ano Fundamental','6º Ano Fundamental',
  '7º Ano Fundamental','8º Ano Fundamental','9º Ano Fundamental',
  '1ª Série Médio','2ª Série Médio','3ª Série Médio',
]

function formatSlotDate(date: Date | string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  })
}

const slide = {
  enter:  (d: number) => ({ opacity: 0, x: d > 0 ? 32 : -32 }),
  center: { opacity: 1, x: 0 },
  exit:   (d: number) => ({ opacity: 0, x: d > 0 ? -32 : 32 }),
}

// Step pill indicator — compact, doesn't eat space
function Steps({ current }: { current: number }) {
  const labels = ['Série', 'Horário', 'Dados']
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28 }}>
      {labels.map((label, i) => {
        const n = i + 1
        const done    = current > n
        const active  = current === n
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                background: done ? '#23A455' : active ? '#23A455' : 'rgba(255,255,255,0.08)',
                color: done || active ? 'white' : 'rgba(255,255,255,0.35)',
                border: done || active ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
                flexShrink: 0,
              }}>
                {done ? <Check style={{ width: 13, height: 13 }} /> : n}
              </div>
              <span style={{
                fontSize: 12, fontWeight: active ? 700 : 500,
                color: active ? 'white' : done ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
                whiteSpace: 'nowrap',
              }}>{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div style={{ width: 24, height: 1, background: 'rgba(255,255,255,0.12)', margin: '0 8px', flexShrink: 0 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function AgendamentoPage() {
  const [step, setStep] = useState(1)
  const [dir,  setDir]  = useState(1)

  const [grade,             setGrade]             = useState('')
  const [subject,           setSubject]           = useState('')
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
  const [loadingSubjects,   setLoadingSubjects]   = useState(false)

  const [slots,        setSlots]        = useState<AvailableSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)

  const [parentName,  setParentName]  = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [studentName, setStudentName] = useState('')
  const [reason,      setReason]      = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [emailError,  setEmailError]  = useState('')

  function goTo(next: number) { setDir(next > step ? 1 : -1); setStep(next) }

  useEffect(() => {
    if (!grade) return
    setLoadingSubjects(true)
    fetch('/api/disciplinas')
      .then(r => r.json())
      .then(data => {
        const filtered = [...new Set(
          data.filter((s: any) => s.grade === grade).map((s: any) => s.name)
        )] as string[]
        setAvailableSubjects(filtered)
        setSubject('')
      })
      .finally(() => setLoadingSubjects(false))
  }, [grade])

  async function loadSlots() {
    setLoadingSlots(true)
    try {
      const res = await fetch(`/api/disponibilidade?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}`)
      setSlots(await res.json())
    } finally { setLoadingSlots(false) }
  }

  async function handleSubmit() {
    if (!selectedSlot) return
    setSubmitting(true); setSubmitError('')
    try {
      const res = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          availabilityId: selectedSlot.availabilityId,
          date: selectedSlot.date,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          parentName, parentEmail, parentPhone,
          studentName, studentGrade: grade, reason, subjectName: subject,
        }),
      })
      if (!res.ok) { setSubmitError((await res.json()).error || 'Erro ao agendar.'); return }
      goTo(4)
    } catch { setSubmitError('Erro de conexão. Verifique sua internet.')
    } finally { setSubmitting(false) }
  }

  const calendarLink = selectedSlot ? generateCalendarLink({
    title: `Reunião Pro Campus — ${subject}`,
    date:  new Date(selectedSlot.date).toISOString().split('T')[0],
    startTime: selectedSlot.startTime,
    endTime:   selectedSlot.endTime,
    description: `Professor(a): ${selectedSlot.teacherName}\nDisciplina: ${subject} — ${grade}\nAluno: ${studentName}\nMotivo: ${reason}`,
  }) : ''

  const slotsByDate = slots.reduce((acc, slot) => {
    const key = new Date(slot.date).toDateString()
    if (!acc[key]) acc[key] = []
    acc[key].push(slot)
    return acc
  }, {} as Record<string, AvailableSlot[]>)

  return (
    <div style={{ minHeight: '100vh', background: '#050e08' }}>

      {/* ── TOP BAR ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(5,14,8,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(97,206,112,0.1)',
      }}>
        <div style={{
          maxWidth: 640, margin: '0 auto',
          padding: '0 20px',
          height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '6px 12px',
              color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>
              <ArrowLeft style={{ width: 14, height: 14 }} />
              Voltar
            </button>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Pro Campus" style={{ width: 28, height: 28, objectFit: 'contain' }} />
            <span style={{ fontFamily: '"Roboto Slab", Georgia, serif', fontWeight: 800, color: 'white', fontSize: 14 }}>
              Pro Campus
            </span>
          </div>

          <div style={{ width: 72 }} />
        </div>

        {/* Steps bar — inside sticky header */}
        {step < 4 && (
          <div style={{ padding: '10px 20px 14px', maxWidth: 640, margin: '0 auto' }}>
            <Steps current={step} />
          </div>
        )}
      </div>

      {/* ── MAIN ── */}
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 60px' }}>

        {step < 4 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 20, textAlign: 'center' }}
          >
            <h1 style={{
              fontFamily: '"Roboto Slab", Georgia, serif',
              fontWeight: 900, fontSize: 'clamp(22px,5vw,28px)',
              color: 'white', margin: 0, letterSpacing: '-0.03em',
            }}>
              {step === 1 && 'Qual a disciplina?'}
              {step === 2 && 'Escolha o horário'}
              {step === 3 && 'Seus dados'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.38)', marginTop: 6, fontSize: 14 }}>
              {step === 1 && 'Selecione a série e a disciplina do seu filho'}
              {step === 2 && `${subject} · ${grade}`}
              {step === 3 && 'Preencha para confirmar o agendamento'}
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="wait" custom={dir}>

          {/* ══ STEP 1 ══ */}
          {step === 1 && (
            <motion.div key="s1" custom={dir} variants={slide}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3, ease: [0.22,1,0.36,1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {/* Grade selector */}
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(97,206,112,0.12)',
                borderRadius: 16, padding: 20,
              }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Série do aluno
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    style={{
                      width: '100%', padding: '13px 44px 13px 16px', borderRadius: 12,
                      border: '1.5px solid rgba(97,206,112,0.2)',
                      background: 'rgba(255,255,255,0.06)',
                      color: grade ? 'white' : 'rgba(255,255,255,0.35)',
                      fontSize: 15, outline: 'none', appearance: 'none',
                      fontFamily: 'inherit', cursor: 'pointer',
                    }}
                  >
                    <option value="" style={{ background: '#0a1a0d' }}>Selecione a série</option>
                    {GRADES.map(g => <option key={g} value={g} style={{ background: '#0a1a0d' }}>{g}</option>)}
                  </select>
                  <ChevronDown style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Subject chips */}
              <AnimatePresence>
                {grade && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(97,206,112,0.12)',
                      borderRadius: 16, padding: 20,
                    }}
                  >
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                      Disciplina
                    </label>
                    {loadingSubjects ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', fontSize: 14, padding: '8px 0' }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(97,206,112,0.2)', borderTopColor: '#23A455', animation: 'spin .7s linear infinite' }} />
                        Carregando...
                      </div>
                    ) : availableSubjects.length === 0 ? (
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Nenhuma disciplina disponível.</p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {availableSubjects.map(s => (
                          <button key={s} onClick={() => setSubject(s)}
                            style={{
                              padding: '10px 16px', borderRadius: 100,
                              fontSize: 14, fontWeight: 600, cursor: 'pointer',
                              transition: 'all 0.2s',
                              background: subject === s ? 'linear-gradient(135deg,#23A455,#61CE70)' : 'rgba(255,255,255,0.06)',
                              color: subject === s ? '#041809' : 'rgba(255,255,255,0.7)',
                              border: subject === s ? '2px solid transparent' : '1.5px solid rgba(97,206,112,0.2)',
                              boxShadow: subject === s ? '0 4px 20px rgba(97,206,112,0.3)' : 'none',
                            }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                disabled={!grade || !subject}
                onClick={() => { loadSlots(); goTo(2) }}
                style={{
                  width: '100%', padding: '16px 24px', borderRadius: 14,
                  border: 'none', cursor: grade && subject ? 'pointer' : 'not-allowed',
                  background: grade && subject ? 'linear-gradient(135deg,#23A455,#61CE70)' : 'rgba(255,255,255,0.06)',
                  color: grade && subject ? '#041809' : 'rgba(255,255,255,0.25)',
                  fontSize: 16, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  fontFamily: '"Roboto Slab", Georgia, serif',
                  boxShadow: grade && subject ? '0 8px 30px rgba(97,206,112,0.35)' : 'none',
                  transition: 'all 0.3s',
                }}
              >
                Ver horários disponíveis
                <ArrowRight style={{ width: 18, height: 18 }} />
              </button>
            </motion.div>
          )}

          {/* ══ STEP 2 ══ */}
          {step === 2 && (
            <motion.div key="s2" custom={dir} variants={slide}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3, ease: [0.22,1,0.36,1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(97,206,112,0.12)',
                borderRadius: 16, padding: 20,
                minHeight: 200,
              }}>
                {loadingSlots ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid rgba(97,206,112,0.2)', borderTopColor: '#23A455', animation: 'spin .7s linear infinite' }} />
                  </div>
                ) : slots.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 0' }}>
                    <CalendarDays style={{ width: 36, height: 36, color: 'rgba(255,255,255,0.15)', margin: '0 auto 12px' }} />
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 600 }}>Nenhum horário disponível</p>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, marginTop: 4 }}>Aguarde novos horários da secretaria.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {Object.entries(slotsByDate).map(([dateKey, dateSlots]) => (
                      <div key={dateKey}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#61CE70', marginBottom: 10, textTransform: 'capitalize', letterSpacing: '0.05em' }}>
                          {formatSlotDate(dateSlots[0].date)}
                        </p>
                        {/* TIME SLOTS — vertical list on mobile, easier to tap */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {dateSlots.map(slot => {
                            const isSelected =
                              selectedSlot?.availabilityId === slot.availabilityId &&
                              String(selectedSlot?.date) === String(slot.date) &&
                              selectedSlot?.startTime === slot.startTime

                            return (
                              <button
                                key={`${slot.availabilityId}-${slot.date}-${slot.startTime}`}
                                onClick={() => !slot.isBooked && setSelectedSlot(slot)}
                                disabled={slot.isBooked}
                                style={{
                                  width: '100%',
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '14px 16px', borderRadius: 12,
                                  cursor: slot.isBooked ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s',
                                  background: slot.isBooked
                                    ? 'rgba(255,255,255,0.02)'
                                    : isSelected
                                    ? 'linear-gradient(135deg,rgba(35,164,85,0.25),rgba(97,206,112,0.15))'
                                    : 'rgba(255,255,255,0.04)',
                                  border: slot.isBooked
                                    ? '1.5px solid rgba(255,255,255,0.05)'
                                    : isSelected
                                    ? '1.5px solid rgba(97,206,112,0.5)'
                                    : '1.5px solid rgba(97,206,112,0.12)',
                                  opacity: slot.isBooked ? 0.4 : 1,
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: isSelected ? 'rgba(97,206,112,0.25)' : 'rgba(255,255,255,0.06)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                  }}>
                                    <Clock style={{ width: 16, height: 16, color: isSelected ? '#61CE70' : 'rgba(255,255,255,0.4)' }} />
                                  </div>
                                  <div style={{ textAlign: 'left' }}>
                                    <p style={{ fontWeight: 700, fontSize: 16, color: slot.isBooked ? 'rgba(255,255,255,0.3)' : isSelected ? '#a8ffc0' : 'white', margin: 0 }}>
                                      {slot.startTime}
                                    </p>
                                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0, marginTop: 1 }}>
                                      Prof. {slot.teacherName}
                                    </p>
                                  </div>
                                </div>
                                {slot.isBooked
                                  ? <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>Reservado</span>
                                  : isSelected
                                  ? <Check style={{ width: 18, height: 18, color: '#61CE70' }} />
                                  : <ChevronRight style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.2)' }} />
                                }
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => goTo(1)} style={{
                  flex: 1, padding: '14px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)',
                  fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <ArrowLeft style={{ width: 16, height: 16 }} /> Voltar
                </button>
                <button
                  disabled={!selectedSlot}
                  onClick={() => goTo(3)}
                  style={{
                    flex: 2, padding: '14px', borderRadius: 12, border: 'none',
                    background: selectedSlot ? 'linear-gradient(135deg,#23A455,#61CE70)' : 'rgba(255,255,255,0.06)',
                    color: selectedSlot ? '#041809' : 'rgba(255,255,255,0.2)',
                    fontSize: 15, fontWeight: 800, cursor: selectedSlot ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: '"Roboto Slab", Georgia, serif',
                    boxShadow: selectedSlot ? '0 6px 24px rgba(97,206,112,0.3)' : 'none',
                    transition: 'all 0.3s',
                  }}
                >
                  Continuar <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ══ STEP 3 ══ */}
          {step === 3 && (
            <motion.div key="s3" custom={dir} variants={slide}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3, ease: [0.22,1,0.36,1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {selectedSlot && (
                <div style={{ background: 'rgba(35,164,85,0.12)', border: '1px solid rgba(97,206,112,0.25)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(97,206,112,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CalendarDays style={{ width: 17, height: 17, color: '#61CE70' }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'white', margin: 0, textTransform: 'capitalize' }}>
                      {formatSlotDate(selectedSlot.date)} · {selectedSlot.startTime}
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0, marginTop: 2 }}>
                      Prof. {selectedSlot.teacherName} · {subject}
                    </p>
                  </div>
                </div>
              )}

              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(97,206,112,0.12)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                
                <Input
                  label="Seu nome completo"
                  value={parentName}
                  onChange={e => setParentName(e.target.value)}
                  placeholder="Nome do responsável"
                  required
                  icon={<User style={{ width: 15, height: 15 }} />}
                />

                <Input
                  label="E-mail"
                  type="email"
                  value={parentEmail}
                  onChange={e => { setParentEmail(e.target.value); setEmailError('') }}
                  onBlur={e => { if (e.target.value && !isValidEmail(e.target.value)) setEmailError('E-mail inválido') }}
                  placeholder="seu@email.com"
                  required
                  error={emailError}
                  icon={<Mail style={{ width: 15, height: 15 }} />}
                />

                <Input
                  label="WhatsApp"
                  type="tel"
                  value={parentPhone}
                  onChange={e => setParentPhone(maskPhoneBr(e.target.value))}
                  placeholder="(86) 99999-9999"
                  required
                  icon={<Phone style={{ width: 15, height: 15 }} />}
                />

                <Input
                  label="Nome do aluno"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  placeholder="Nome do seu filho(a)"
                  required
                  icon={<GraduationCap style={{ width: 15, height: 15 }} />}
                />

                <Input
                  label="Motivo da reunião"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Descreva brevemente o motivo..."
                  required
                  multiline
                  rows={3}
                  icon={<MessageSquare style={{ width: 15, height: 15 }} />}
                />
              </div>

              {submitError && (
                <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', color: '#fca5a5', padding: '12px 16px', borderRadius: 10, fontSize: 13 }}>
                  {submitError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => goTo(2)} style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <ArrowLeft style={{ width: 16, height: 16 }} /> Voltar
                </button>
                <button
                  disabled={submitting || !parentName || !parentEmail || !parentPhone || !studentName || !reason || !!emailError}
                  onClick={handleSubmit}
                  style={{
                    flex: 2, padding: '14px', borderRadius: 12, border: 'none',
                    background: (!submitting && parentName && parentEmail && parentPhone && studentName && reason && !emailError) ? 'linear-gradient(135deg,#23A455,#61CE70)' : 'rgba(255,255,255,0.06)',
                    color: (!submitting && parentName && parentEmail && parentPhone && studentName && reason && !emailError) ? '#041809' : 'rgba(255,255,255,0.2)',
                    fontSize: 15, fontWeight: 800,
                    cursor: (!submitting && parentName && parentEmail && parentPhone && studentName && reason && !emailError) ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: '"Roboto Slab", Georgia, serif', transition: 'all 0.3s',
                  }}
                >
                  {submitting
                    ? <><div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin .7s linear infinite' }} /> Confirmando...</>
                    : <><Check style={{ width: 16, height: 16 }} /> Confirmar</>
                  }
                </button>
              </div>
            </motion.div>
          )}

          {/* ══ STEP 4 — SUCESSO ══ */}
          {step === 4 && selectedSlot && (
            <motion.div key="s4"
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 180, delay: 0.2 }}
                style={{
                  width: 88, height: 88, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#23A455,#61CE70)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 60px rgba(97,206,112,0.4)',
                  marginTop: 20,
                }}
              >
                <CheckCircle style={{ width: 44, height: 44, color: 'white' }} />
              </motion.div>

              <div>
                <h2 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 900, fontSize: 32, color: 'white', margin: 0 }}>Agendado!</h2>
                <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: 8, fontSize: 14 }}>
                  Confirmação enviada para <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{parentEmail}</strong>
                </p>
              </div>

              {/* Summary card */}
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(97,206,112,0.15)', borderRadius: 16, padding: 20, textAlign: 'left' }}>
                {[
                  { label: 'Professor(a)', value: selectedSlot.teacherName },
                  { label: 'Disciplina',   value: `${subject} — ${grade}` },
                  { label: 'Aluno',        value: studentName },
                  { label: 'Data e Hora',  value: `${formatSlotDate(selectedSlot.date)} às ${selectedSlot.startTime}`, hl: true },
                  { label: 'Motivo',       value: reason },
                ].map((item, i, arr) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', paddingBottom: i < arr.length-1 ? 12 : 0, marginBottom: i < arr.length-1 ? 12 : 0, borderBottom: i < arr.length-1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, flexShrink: 0 }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: item.hl ? 700 : 500, color: item.hl ? '#61CE70' : 'rgba(255,255,255,0.8)', textAlign: 'right', textTransform: item.hl ? 'capitalize' : 'none' as any }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Local info */}
              <div style={{ width: '100%', background: 'rgba(35,164,85,0.08)', border: '1px solid rgba(97,206,112,0.15)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                <MapPin style={{ width: 15, height: 15, color: '#61CE70', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'white', margin: 0 }}>Grupo Educacional Pro Campus</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0, marginTop: 2 }}>Apresente-se à secretaria 5 minutos antes.</p>
                </div>
              </div>

              {/* Calendar CTA */}
              <a href={calendarLink} target="_blank" rel="noopener noreferrer" style={{ width: '100%', textDecoration: 'none' }}>
                <button style={{
                  width: '100%', padding: '15px 24px', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg,#23A455,#61CE70)',
                  color: '#041809', fontSize: 15, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  fontFamily: '"Roboto Slab", Georgia, serif',
                  boxShadow: '0 8px 30px rgba(97,206,112,0.3)',
                }}>
                  <CalendarDays style={{ width: 18, height: 18 }} />
                  Adicionar ao Google Agenda
                  <ExternalLink style={{ width: 14, height: 14, opacity: 0.6 }} />
                </button>
              </a>

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
// procampus-agendamento/src/app/agendamento/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Check, CalendarDays,
  Clock, User, Mail, Phone, MessageSquare, GraduationCap,
  CheckCircle, ExternalLink, ChevronDown, MapPin
} from 'lucide-react'
import StepIndicator   from '@/components/agendamento/StepIndicator'
import Input           from '@/components/ui/Input'
import Button          from '@/components/ui/Button'
import LoadingSpinner  from '@/components/ui/LoadingSpinner'
import { generateCalendarLink } from '@/lib/calendar-link'
import type { AvailableSlot } from '@/types'

const GRADES = [
  'Educação Infantil',
  '1º Ano Fundamental', '2º Ano Fundamental', '3º Ano Fundamental',
  '4º Ano Fundamental', '5º Ano Fundamental', '6º Ano Fundamental',
  '7º Ano Fundamental', '8º Ano Fundamental', '9º Ano Fundamental',
  '1ª Série Médio', '2ª Série Médio', '3ª Série Médio',
]

function formatSlotDate(date: Date | string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  })
}

// ── Slide de entrada/saída dos steps ─────────────────────
const slideVariants = {
  enter:  (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit:   (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
}

export default function AgendamentoPage() {
  const [step,     setStep]     = useState(1)
  const [dir,      setDir]      = useState(1)

  // Step 1
  const [grade,              setGrade]              = useState('')
  const [subject,            setSubject]            = useState('')
  const [availableSubjects,  setAvailableSubjects]  = useState<string[]>([])
  const [loadingSubjects,    setLoadingSubjects]    = useState(false)

  // Step 2
  const [slots,        setSlots]        = useState<AvailableSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)

  // Step 3
  const [parentName,  setParentName]  = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [studentName, setStudentName] = useState('')
  const [reason,      setReason]      = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState('')

  function goTo(next: number) {
    setDir(next > step ? 1 : -1)
    setStep(next)
  }

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
      const res = await fetch(
        `/api/disponibilidade?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}`
      )
      setSlots(await res.json())
    } finally { setLoadingSlots(false) }
  }


  async function handleSubmit() {
    if (!selectedSlot) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          availabilityId: selectedSlot.availabilityId,
          date:           selectedSlot.date,
          startTime:      selectedSlot.startTime,
          endTime:        selectedSlot.endTime,
          parentName,
          parentEmail,
          parentPhone,
          studentName,
          studentGrade: grade,
          reason,
          subjectName:  subject,
        }),
      })
      if (!res.ok) {
        setSubmitError((await res.json()).error || 'Erro ao agendar.')
        return
      }
      goTo(4)
    } catch {
      setSubmitError('Erro de conexão. Verifique sua internet.')
    } finally {
      setSubmitting(false)
    }
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
    <div style={{ minHeight: '100vh', background: '#f7fdf8' }}>

      {/* Navbar */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'linear-gradient(135deg,#0D2818,#1a7a2e)',
        borderBottom: '1px solid rgba(97,206,112,0.15)',
      }}>
        <div style={{ maxWidth: 768, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/">
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 500, transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'white'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}>
              <ArrowLeft style={{ width: 15, height: 15 }} />
              Voltar
            </button>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Pro Campus"
              style={{ width: 32, height: 32, objectFit: 'contain', display: 'block' }}
            />
            <span style={{ fontFamily: 'var(--font-display),"Roboto Slab",serif', fontWeight: 800, color: 'white', fontSize: 15 }}>
              Pro Campus
            </span>
          </div>

          <div style={{ width: 60 }} />
        </div>
      </nav>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>

        {/* Título */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display),"Roboto Slab",serif', fontWeight: 800, fontSize: 'clamp(26px,5vw,34px)', color: '#0a1a0d', lineHeight: 1.1 }}>
            Agendar Reunião
          </h1>
          <p style={{ color: '#6b8f72', marginTop: 8, fontSize: 15 }}>
            Preencha os dados abaixo e confirme seu horário
          </p>
        </motion.div>

        {step < 4 && <StepIndicator current={step} />}

        <AnimatePresence mode="wait" custom={dir}>

          {/* ══ STEP 1 ══════════════════════════════════ */}
          {step === 1 && (
            <motion.div key="s1" custom={dir} variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: [0.22,1,0.36,1] }}
            >
              <div style={{ background: 'white', borderRadius: 24, border: '1.5px solid rgba(97,206,112,0.15)', padding: 32, boxShadow: '0 4px 32px rgba(0,0,0,0.06)' }}>
                <h2 style={{ fontFamily: 'var(--font-display),"Roboto Slab",serif', fontWeight: 700, fontSize: 20, color: '#0a1a0d', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GraduationCap style={{ width: 20, height: 20, color: '#23A455' }} />
                  Série e Disciplina
                </h2>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3d5c42', marginBottom: 8 }}>
                    Série do aluno
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={grade}
                      onChange={e => setGrade(e.target.value)}
                      style={{
                        width: '100%', padding: '13px 44px 13px 16px', borderRadius: 12,
                        border: '1.5px solid rgba(97,206,112,0.2)', background: 'white',
                        fontSize: 14, outline: 'none', appearance: 'none', fontFamily: 'inherit', color: '#0a1a0d', cursor: 'pointer',
                      }}
                    >
                      <option value="">Selecione a série</option>
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <ChevronDown style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#6b8f72', pointerEvents: 'none' }} />
                  </div>
                </div>

                {grade && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3d5c42', marginBottom: 8 }}>
                      Disciplina
                    </label>
                    {loadingSubjects ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', color: '#6b8f72', fontSize: 14 }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(97,206,112,0.2)', borderTopColor: '#23A455', animation: 'spin 0.7s linear infinite' }} />
                        Carregando...
                      </div>
                    ) : availableSubjects.length === 0 ? (
                      <p style={{ color: '#6b8f72', fontSize: 14, padding: '12px 16px', background: '#f7fdf8', borderRadius: 10 }}>
                        Nenhuma disciplina disponível para esta série.
                      </p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                        {availableSubjects.map(s => (
                          <button key={s} onClick={() => setSubject(s)}
                            style={{
                              padding: '12px 16px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                              cursor: 'pointer', transition: 'all 0.2s',
                              background: subject === s ? 'linear-gradient(135deg,#23A455,#61CE70)' : 'white',
                              color: subject === s ? 'white' : '#3d5c42',
                              border: subject === s ? '2px solid transparent' : '2px solid rgba(97,206,112,0.2)',
                              boxShadow: subject === s ? '0 4px 16px rgba(97,206,112,0.35)' : 'none',
                            }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                <div style={{ marginTop: 28 }}>
                  <Button
                    variant="primary" size="lg"
                    disabled={!grade || !subject}
                    onClick={() => { loadSlots(); goTo(2) }}
                    iconRight={<ArrowRight style={{ width: 18, height: 18 }} />}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Ver horários disponíveis
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ STEP 2 ══════════════════════════════════ */}
          {step === 2 && (
            <motion.div key="s2" custom={dir} variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: [0.22,1,0.36,1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div style={{ background: 'white', borderRadius: 24, border: '1.5px solid rgba(97,206,112,0.15)', padding: 32, boxShadow: '0 4px 32px rgba(0,0,0,0.06)' }}>
                <h2 style={{ fontFamily: 'var(--font-display),"Roboto Slab",serif', fontWeight: 700, fontSize: 20, color: '#0a1a0d', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock style={{ width: 20, height: 20, color: '#23A455' }} />
                  Escolha o Horário
                </h2>
                <p style={{ color: '#6b8f72', fontSize: 13, marginBottom: 24 }}>{subject} · {grade}</p>

                {loadingSlots ? (
                  <LoadingSpinner />
                ) : slots.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px', background: '#f7fdf8', borderRadius: 16 }}>
                    <CalendarDays style={{ width: 40, height: 40, color: '#c8d8ca', margin: '0 auto 12px' }} />
                    <p style={{ fontWeight: 600, color: '#3d5c42' }}>Nenhum horário disponível</p>
                    <p style={{ color: '#6b8f72', fontSize: 13, marginTop: 4 }}>Aguarde a secretaria cadastrar novos horários.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {Object.entries(slotsByDate).map(([dateKey, dateSlots]) => (
                      <div key={dateKey}>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#3d5c42', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'capitalize' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#23A455', display: 'inline-block', flexShrink: 0 }} />
                          {formatSlotDate(dateSlots[0].date)}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                          {dateSlots.map(slot => {
                            const isSelected =
                              selectedSlot?.availabilityId === slot.availabilityId &&
                              String(selectedSlot?.date)   === String(slot.date) &&
                              selectedSlot?.startTime      === slot.startTime

                            return (
                              <button
                                key={`${slot.availabilityId}-${String(slot.date)}-${slot.startTime}`}
                                onClick={() => !slot.isBooked && setSelectedSlot(slot)}
                                disabled={slot.isBooked}
                                title={slot.isBooked ? 'Horário já reservado' : `${slot.startTime} — ${slot.teacherName.split(' ')[0]}`}
                                style={{
                                  padding: '12px 8px',
                                  borderRadius: 12,
                                  fontSize: 13,
                                  fontWeight: 600,
                                  textAlign: 'center',
                                  transition: 'all 0.2s',
                                  cursor: slot.isBooked ? 'not-allowed' : 'pointer',

                                  // Estados visuais
                                  background: slot.isBooked
                                    ? '#fef2f2'
                                    : isSelected
                                    ? 'linear-gradient(135deg,#23A455,#61CE70)'
                                    : '#f0faf2',

                                  color: slot.isBooked
                                    ? '#fca5a5'
                                    : isSelected
                                    ? 'white'
                                    : '#23A455',

                                  border: slot.isBooked
                                    ? '2px solid #fecaca'
                                    : isSelected
                                    ? '2px solid transparent'
                                    : '2px solid rgba(97,206,112,0.25)',

                                  boxShadow: isSelected
                                    ? '0 4px 16px rgba(97,206,112,0.4)'
                                    : 'none',

                                  opacity: slot.isBooked ? 0.7 : 1,
                                  position: 'relative',
                                }}
                              >
                                <div>{slot.startTime}</div>
                                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>
                                  {slot.isBooked
                                    ? 'Reservado'
                                    : slot.teacherName.split(' ')[0]}
                                </div>

                                {/* Ícone de cadeado nos ocupados */}
                                {slot.isBooked && (
                                  <div style={{
                                    position: 'absolute',
                                    top: 4, right: 4,
                                    fontSize: 9,
                                  }}>
                                    🔒
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <Button variant="outline" onClick={() => goTo(1)} icon={<ArrowLeft style={{ width: 16, height: 16 }} />} style={{ flex: 1, justifyContent: 'center' }}>
                  Voltar
                </Button>
                <Button variant="primary" disabled={!selectedSlot} onClick={() => goTo(3)} iconRight={<ArrowRight style={{ width: 16, height: 16 }} />} style={{ flex: 1, justifyContent: 'center' }}>
                  Continuar
                </Button>
              </div>
            </motion.div>
          )}

          {/* ══ STEP 3 ══════════════════════════════════ */}
          {step === 3 && (
            <motion.div key="s3" custom={dir} variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: [0.22,1,0.36,1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              {/* Resumo do slot */}
              {selectedSlot && (
                <div style={{
                  borderRadius: 20, padding: '18px 22px', color: 'white',
                  background: 'linear-gradient(135deg,#0D2818,#1a7a2e)',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CalendarDays style={{ width: 20, height: 20, color: 'white' }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, textTransform: 'capitalize' }}>
                      {formatSlotDate(selectedSlot.date)}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 2 }}>
                      {selectedSlot.startTime} · Prof. {selectedSlot.teacherName} · {subject}
                    </p>
                  </div>
                </div>
              )}

              <div style={{ background: 'white', borderRadius: 24, border: '1.5px solid rgba(97,206,112,0.15)', padding: 32, boxShadow: '0 4px 32px rgba(0,0,0,0.06)' }}>
                <h2 style={{ fontFamily: 'var(--font-display),"Roboto Slab",serif', fontWeight: 700, fontSize: 20, color: '#0a1a0d', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User style={{ width: 20, height: 20, color: '#23A455' }} />
                  Seus Dados
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Input label="Seu nome completo" value={parentName} onChange={e => setParentName(e.target.value)}
                    placeholder="Nome do responsável" required icon={<User style={{ width: 15, height: 15 }} />} />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <Input label="E-mail" type="email" value={parentEmail} onChange={e => setParentEmail(e.target.value)}
                      placeholder="seu@email.com" required icon={<Mail style={{ width: 15, height: 15 }} />} />
                    <Input label="WhatsApp" type="tel" value={parentPhone} onChange={e => setParentPhone(e.target.value)}
                      placeholder="(86) 99999-9999" required icon={<Phone style={{ width: 15, height: 15 }} />} />
                  </div>

                  <Input label="Nome do aluno" value={studentName} onChange={e => setStudentName(e.target.value)}
                    placeholder="Nome do seu filho(a)" required icon={<GraduationCap style={{ width: 15, height: 15 }} />} />

                  <Input label="Motivo da reunião" value={reason} onChange={e => setReason(e.target.value)}
                    placeholder="Descreva brevemente o motivo..." required
                    multiline rows={3} icon={<MessageSquare style={{ width: 15, height: 15 }} />} />
                </div>

                {submitError && (
                  <div style={{ marginTop: 16, background: '#fef2f2', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', padding: '12px 16px', borderRadius: 10, fontSize: 13 }}>
                    {submitError}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <Button variant="outline" onClick={() => goTo(2)} icon={<ArrowLeft style={{ width: 16, height: 16 }} />} style={{ flex: 1, justifyContent: 'center' }}>
                  Voltar
                </Button>
                <Button variant="primary" loading={submitting}
                  disabled={submitting || !parentName || !parentEmail || !parentPhone || !studentName || !reason}
                  onClick={handleSubmit} icon={<Check style={{ width: 16, height: 16 }} />}
                  style={{ flex: 1, justifyContent: 'center' }}>
                  Confirmar
                </Button>
              </div>
            </motion.div>
          )}

          {/* ══ STEP 4 — CONFIRMAÇÃO ════════════════════ */}
          {step === 4 && selectedSlot && (
            <motion.div key="s4"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center' }}
            >
              {/* Ícone animado */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                style={{
                  width: 96, height: 96, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#23A455,#61CE70)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 16px 48px rgba(97,206,112,0.45)',
                }}
              >
                <CheckCircle style={{ width: 48, height: 48, color: 'white' }} />
              </motion.div>

              <div>
                <h2 style={{ fontFamily: 'var(--font-display),"Roboto Slab",serif', fontWeight: 900, fontSize: 34, color: '#0a1a0d' }}>
                  Agendado!
                </h2>
                <p style={{ color: '#6b8f72', marginTop: 8, fontSize: 15 }}>
                  Confirmação enviada para{' '}
                  <strong style={{ color: '#3d5c42' }}>{parentEmail}</strong>
                </p>
              </div>

              {/* Card de resumo */}
              <div style={{ width: '100%', background: 'white', borderRadius: 24, border: '1.5px solid rgba(97,206,112,0.15)', padding: 28, boxShadow: '0 4px 32px rgba(0,0,0,0.06)', textAlign: 'left' }}>
                {[
                  { label: 'Professor(a)', value: selectedSlot.teacherName },
                  { label: 'Disciplina',   value: `${subject} — ${grade}` },
                  { label: 'Aluno',        value: studentName },
                  { label: 'Data e Hora',  value: `${formatSlotDate(selectedSlot.date)} às ${selectedSlot.startTime}`, hl: true },
                  { label: 'Duração',      value: '30 minutos' },
                  { label: 'Motivo',       value: reason },
                ].map((item, i, arr) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', paddingBottom: i < arr.length-1 ? 14 : 0, marginBottom: i < arr.length-1 ? 14 : 0, borderBottom: i < arr.length-1 ? '1px solid rgba(97,206,112,0.08)' : 'none' }}>
                    <span style={{ color: '#6b8f72', fontSize: 13, flexShrink: 0 }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: item.hl ? 700 : 500, color: item.hl ? '#23A455' : '#0a1a0d', textAlign: 'right' }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Local */}
              <div style={{ width: '100%', background: '#f0faf2', borderRadius: 14, padding: '14px 18px', border: '1px solid rgba(97,206,112,0.15)', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                <MapPin style={{ width: 16, height: 16, color: '#23A455', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#3d5c42' }}>Grupo Educacional Pro Campus</p>
                  <p style={{ fontSize: 12, color: '#6b8f72', marginTop: 2 }}>Apresente-se à secretaria 5 minutos antes.</p>
                </div>
              </div>

              {/* Botão Google Calendar */}
              <a href={calendarLink} target="_blank" rel="noopener noreferrer" style={{ width: '100%' }}>
                <Button variant="primary" size="lg"
                  icon={<CalendarDays style={{ width: 18, height: 18 }} />}
                  iconRight={<ExternalLink style={{ width: 14, height: 14, opacity: 0.7 }} />}
                  style={{ width: '100%', justifyContent: 'center' }}>
                  Adicionar ao Google Agenda
                </Button>
              </a>
              <p style={{ color: '#6b8f72', fontSize: 12, marginTop: -12 }}>
                Salve no calendário e receba lembrete automático 1 dia antes
              </p>

              <Link href="/">
                <button style={{ background: 'none', border: 'none', color: '#23A455', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  ← Voltar para o início
                </button>
              </Link>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  )
}

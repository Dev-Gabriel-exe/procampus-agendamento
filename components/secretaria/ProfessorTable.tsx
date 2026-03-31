// components/secretaria/ProfessorTable.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Pencil, Trash2, Plus, Mail, Phone, ChevronDown, Clock, Calendar, Star } from 'lucide-react'
import type { Teacher, Subject } from '@/types'

const DAYS_FULL  = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado']
const DAYS_SHORT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const DAY_COLORS: Record<number, { bg: string; color: string; border: string }> = {
  0: { bg: '#fef9c3', color: '#92400e', border: '#fde68a' },
  1: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  2: { bg: '#f0faf2', color: '#15803d', border: '#bbf7d0' },
  3: { bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' },
  4: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  5: { bg: '#fdf2f8', color: '#be185d', border: '#fbcfe8' },
  6: { bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' },
}

const SPECIAL_COLOR = { bg: '#f5f3ff', color: '#7c3aed', border: '#c4b5fd' }

// ── Tipos locais ──────────────────────────────────────────────────────────────
type AvailabilityItem = {
  id: string
  dayOfWeek?: number | null
  specificDate?: Date | string | null  // ← Date (Prisma) ou string (JSON serializado)
  isSpecial?: boolean | null           // ← null possível vindo do banco
  startTime: string
  endTime: string
  active: boolean
  appointments?: { id: string; date: string; startTime: string }[]
}

// Omit<Teacher, 'availabilities'> descarta o campo do tipo global (que não tem
// isSpecial/specificDate) e deixa o AvailabilityItem local assumir.
type TeacherFull = Omit<Teacher, 'availabilities'> & {
  subjects: { subject: Subject }[]
  availabilities?: AvailabilityItem[]
}

interface ProfessorTableProps {
  teachers: TeacherFull[]
  expanded: string | null
  onToggleExpand: (id: string) => void
  onEdit: (t: TeacherFull) => void
  onDelete: (id: string) => void
  onAddDisponibilidade: (t: TeacherFull) => void
  onAddHorarioEspecial: (t: TeacherFull) => void
  onDeleteAvailability: (id: string) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function groupByDay(availabilities: AvailabilityItem[]) {
  const groups: Record<number, AvailabilityItem[]> = {}
  for (const avail of availabilities) {
    if (avail.isSpecial || avail.specificDate) continue
    const day = avail.dayOfWeek ?? 0
    if (!groups[day]) groups[day] = []
    groups[day].push(avail)
  }
  const sorted: { day: number; items: AvailabilityItem[] }[] = []
  for (const day of [1,2,3,4,5,6,0]) {
    if (groups[day]) {
      sorted.push({ day, items: groups[day].sort((a, b) => a.startTime.localeCompare(b.startTime)) })
    }
  }
  return sorted
}

// Aceita Date ou string — o Prisma retorna Date, mas após JSON.stringify/parse vira string
function formatSpecialDate(value: Date | string) {
  return new Date(value).toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
    timeZone: 'America/Fortaleza',
  })
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function ProfessorTable({
  teachers, expanded, onToggleExpand,
  onEdit, onDelete, onAddDisponibilidade, onAddHorarioEspecial, onDeleteAvailability,
}: ProfessorTableProps) {
  if (teachers.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 24px', background: 'white', borderRadius: 20, border: '1.5px dashed rgba(97,206,112,0.3)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👨‍🏫</div>
        <p style={{ fontWeight: 600, color: '#3d5c42', fontSize: 16 }}>Nenhum professor cadastrado</p>
        <p style={{ color: '#6b8f72', fontSize: 14, marginTop: 6 }}>Clique em "Novo Professor" para começar.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {teachers.map((teacher, i) => {
        const allAvails       = teacher.availabilities || []
        const recurringAvails = allAvails.filter(a => !a.isSpecial && !a.specificDate)
        const specialAvails   = allAvails.filter(a => a.isSpecial || !!a.specificDate)
        const groupedAvails   = groupByDay(recurringAvails)
        const totalSlots      = allAvails.length

        return (
          <motion.div key={teacher.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            style={{ background: 'white', borderRadius: 18, border: '1.5px solid rgba(97,206,112,0.12)', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>

            {/* Linha principal */}
            <div style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>

                {/* Avatar */}
                <div style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, background: 'linear-gradient(135deg,#23A455,#61CE70)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(97,206,112,0.35)' }}>
                  <span style={{ fontFamily: 'var(--font-display),"Roboto Slab",serif', fontWeight: 800, color: 'white', fontSize: 18 }}>
                    {teacher.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontWeight: 700, color: '#0a1a0d', fontSize: 15 }}>{teacher.name}</p>
                  <div style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b8f72' }}>
                      <Mail style={{ width: 11, height: 11 }} />{teacher.email}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b8f72' }}>
                      <Phone style={{ width: 11, height: 11 }} />{teacher.phone}
                    </span>
                  </div>

                  {/* Tags disciplinas */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                    {teacher.subjects.slice(0, 3).map(s => (
                      <span key={s.subject!.id} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: '#f0faf2', color: '#23A455', border: '1px solid rgba(97,206,112,0.2)' }}>
                        {s.subject!.name} — {s.subject!.grade}
                      </span>
                    ))}
                    {teacher.subjects.length > 3 && (
                      <span style={{ fontSize: 11, color: '#6b8f72', padding: '3px 6px' }}>+{teacher.subjects.length - 3} mais</span>
                    )}
                  </div>

                  {/* Resumo dias */}
                  {(groupedAvails.length > 0 || specialAvails.length > 0) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                      {groupedAvails.map(({ day, items }) => {
                        const c = DAY_COLORS[day]
                        return (
                          <span key={day} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                            <Calendar style={{ width: 10, height: 10 }} />
                            {DAYS_SHORT[day]}
                            <span style={{ background: c.color, color: 'white', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>
                              {items.length}
                            </span>
                          </span>
                        )
                      })}
                      {specialAvails.length > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: SPECIAL_COLOR.bg, color: SPECIAL_COLOR.color, border: `1px solid ${SPECIAL_COLOR.border}` }}>
                          <Star style={{ width: 10, height: 10 }} />
                          {specialAvails.length} especial{specialAvails.length !== 1 ? 'is' : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Ações */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button onClick={() => onAddDisponibilidade(teacher)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '7px 12px', borderRadius: 9, border: '1px solid rgba(97,206,112,0.3)', background: '#f0faf2', color: '#23A455', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#e8f9eb'; e.currentTarget.style.borderColor = '#61CE70' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f0faf2'; e.currentTarget.style.borderColor = 'rgba(97,206,112,0.3)' }}>
                  <Plus style={{ width: 13, height: 13 }} />Disponibilidade
                </button>

                <button onClick={() => onAddHorarioEspecial(teacher)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '7px 12px', borderRadius: 9, border: `1px solid ${SPECIAL_COLOR.border}`, background: SPECIAL_COLOR.bg, color: SPECIAL_COLOR.color, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ede9fe'; e.currentTarget.style.borderColor = '#a78bfa' }}
                  onMouseLeave={e => { e.currentTarget.style.background = SPECIAL_COLOR.bg; e.currentTarget.style.borderColor = SPECIAL_COLOR.border }}>
                  <Star style={{ width: 13, height: 13 }} />Horário Especial
                </button>

                <button onClick={() => onEdit(teacher)}
                  style={{ padding: 7, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 8, color: '#23A455', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0faf2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Pencil style={{ width: 15, height: 15 }} />
                </button>
                <button onClick={() => onDelete(teacher.id)}
                  style={{ padding: 7, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 8, color: '#ef4444', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Trash2 style={{ width: 15, height: 15 }} />
                </button>
                <button onClick={() => onToggleExpand(teacher.id)}
                  style={{ padding: 7, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 8, color: '#6b8f72' }}>
                  <motion.div animate={{ rotate: expanded === teacher.id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown style={{ width: 15, height: 15 }} />
                  </motion.div>
                </button>
              </div>
            </div>

            {/* Disponibilidades expandidas */}
            <AnimatePresence>
              {expanded === teacher.id && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                  <div style={{ borderTop: '1px solid rgba(97,206,112,0.1)', padding: '20px 24px', background: '#fafdfb' }}>

                    {totalSlots === 0 ? (
                      <p style={{ fontSize: 13, color: '#6b8f72' }}>
                        Nenhum slot ainda.{' '}
                        <button onClick={() => onAddDisponibilidade(teacher)} style={{ color: '#23A455', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                          Adicionar agora →
                        </button>
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                        {/* ── Recorrentes ── */}
                        {groupedAvails.length > 0 && (
                          <div>
                            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#3d5c42', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Clock style={{ width: 14, height: 14, color: '#23A455' }} />
                              Slots recorrentes ({recurringAvails.length} de 20min)
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                              {groupedAvails.map(({ day, items }) => {
                                const c = DAY_COLORS[day]
                                return (
                                  <div key={day}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontSize: 12, fontWeight: 700 }}>
                                        <Calendar style={{ width: 12, height: 12 }} />
                                        {DAYS_FULL[day]}
                                      </div>
                                      <span style={{ fontSize: 11, color: '#6b8f72' }}>{items.length} slot{items.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 8 }}>
                                      {items.map(avail => {
                                        const futureAppts = avail.appointments?.filter(a => new Date(a.date) >= new Date()).length ?? 0
                                        const isBooked    = futureAppts > 0
                                        return (
                                          <div key={avail.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: isBooked ? '#fff7ed' : 'white', borderRadius: 10, padding: '8px 12px', border: `1.5px solid ${isBooked ? '#fed7aa' : c.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                                            <Clock style={{ width: 12, height: 12, color: isBooked ? '#c2410c' : c.color, flexShrink: 0 }} />
                                            <div>
                                              <p style={{ fontSize: 13, fontWeight: 700, color: '#0a1a0d', margin: 0 }}>
                                                {avail.startTime}<span style={{ color: '#6b8f72', fontWeight: 400 }}> – {avail.endTime}</span>
                                              </p>
                                              {isBooked && <p style={{ fontSize: 10, color: '#c2410c', margin: 0, marginTop: 1 }}>{futureAppts} agendado(s)</p>}
                                            </div>
                                            {!isBooked && (
                                              <button onClick={() => onDeleteAvailability(avail.id)}
                                                style={{ padding: 4, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6, color: '#ef4444', transition: 'background 0.15s', marginLeft: 2 }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <Trash2 style={{ width: 12, height: 12 }} />
                                              </button>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* ── Especiais ── */}
                        {specialAvails.length > 0 && (
                          <div>
                            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#5b21b6', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Star style={{ width: 14, height: 14, color: '#7c3aed' }} />
                              Horários especiais ({specialAvails.length} slot{specialAvails.length !== 1 ? 's' : ''})
                            </h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {specialAvails
                                .slice()
                                .sort((a, b) => {
                                  const da = a.specificDate ? new Date(a.specificDate).getTime() : 0
                                  const db = b.specificDate ? new Date(b.specificDate).getTime() : 0
                                  return da - db
                                })
                                .map(avail => {
                                  const futureAppts = avail.appointments?.filter(a => new Date(a.date) >= new Date()).length ?? 0
                                  const isBooked    = futureAppts > 0
                                  const isPast      = avail.specificDate
                                    ? new Date(avail.specificDate) < new Date()
                                    : false

                                  return (
                                    <div key={avail.id} style={{
                                      display: 'flex', alignItems: 'center', gap: 8,
                                      background: isBooked ? '#fff7ed' : isPast ? '#f9fafb' : SPECIAL_COLOR.bg,
                                      borderRadius: 10, padding: '8px 12px',
                                      border: `1.5px solid ${isBooked ? '#fed7aa' : isPast ? '#e5e7eb' : SPECIAL_COLOR.border}`,
                                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                      opacity: isPast ? 0.6 : 1,
                                    }}>
                                      <Star style={{ width: 12, height: 12, color: isPast ? '#9ca3af' : SPECIAL_COLOR.color, flexShrink: 0 }} />
                                      <div>
                                        {avail.specificDate && (
                                          <p style={{ fontSize: 11, color: isPast ? '#9ca3af' : SPECIAL_COLOR.color, fontWeight: 600, margin: 0, textTransform: 'capitalize' }}>
                                            {formatSpecialDate(avail.specificDate)}
                                          </p>
                                        )}
                                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0a1a0d', margin: 0 }}>
                                          {avail.startTime}<span style={{ color: '#6b8f72', fontWeight: 400 }}> – {avail.endTime}</span>
                                        </p>
                                        {isBooked    && <p style={{ fontSize: 10, color: '#c2410c', margin: 0, marginTop: 1 }}>{futureAppts} agendado(s)</p>}
                                        {isPast && !isBooked && <p style={{ fontSize: 10, color: '#9ca3af', margin: 0, marginTop: 1 }}>Expirado</p>}
                                      </div>
                                      {!isBooked && (
                                        <button onClick={() => onDeleteAvailability(avail.id)}
                                          style={{ padding: 4, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6, color: '#ef4444', transition: 'background 0.15s', marginLeft: 2 }}
                                          onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                          <Trash2 style={{ width: 12, height: 12 }} />
                                        </button>
                                      )}
                                    </div>
                                  )
                                })}
                            </div>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}
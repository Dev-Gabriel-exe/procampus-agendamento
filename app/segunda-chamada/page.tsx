'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { CalendarDays, Users, LogOut, BookOpen, ClipboardList, Plus, Trash2, ChevronDown, AlertCircle, X, Users2 } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import RoleBadge from '@/components/secretaria/RoleBadge'

export const dynamic = 'force-dynamic'

const GRADES_FUND1 = ['Educação Infantil','1º Ano Fundamental','2º Ano Fundamental','3º Ano Fundamental','4º Ano Fundamental','5º Ano Fundamental']
const GRADES_FUND2 = ['6º Ano Fundamental','7º Ano Fundamental','8º Ano Fundamental','9º Ano Fundamental','1ª Série Médio','2ª Série Médio','3ª Série Médio']
const GRADES_ALL   = [...GRADES_FUND1, ...GRADES_FUND2]

type Subject = { id: string; name: string; grade: string }
type ExamBooking = { id: string; studentName: string; parentName: string; parentEmail: string; createdAt: string }
type ExamSchedule = {
  id: string; subjectName: string; grade: string
  date: string; startTime: string; endTime: string
  active: boolean; bookings: ExamBooking[]
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    timeZone: 'America/Fortaleza',
  })
}

export default function SegundaChamadaSecretariaPage() {
  const { data: session } = useSession()
  const role   = (session?.user as any)?.role ?? 'geral'
  const grades = role === 'fund1' ? GRADES_FUND1 : role === 'fund2' ? GRADES_FUND2 : GRADES_ALL

  const [exams,    setExams]    = useState<ExamSchedule[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  // Form
  const [selSubject,  setSelSubject]  = useState('')
  const [selGrade,    setSelGrade]    = useState('')
  const [examDate,    setExamDate]    = useState('')
  const [startTime,   setStartTime]   = useState('')
  const [endTime,     setEndTime]     = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  // Subjects filtradas pela série selecionada
  const availableSubjects = subjects.filter(s => s.grade === selGrade)

  async function loadData() {
    setLoading(true)
    try {
      const [eRes, sRes] = await Promise.all([
        fetch('/api/segunda-chamada'),
        fetch('/api/disciplinas'),
      ])
      setExams(await eRes.json())
      setSubjects(await sRes.json())
    } catch { console.error('Erro ao carregar') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  // Reset subject when grade changes
  useEffect(() => { setSelSubject('') }, [selGrade])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!selSubject || !selGrade || !examDate || !startTime || !endTime) {
      setError('Preencha todos os campos.'); return
    }
    const subject = subjects.find(s => s.id === selSubject)
    if (!subject) { setError('Disciplina inválida.'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/segunda-chamada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: selSubject, subjectName: subject.name, grade: selGrade, date: examDate, startTime, endTime }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao criar'); return }
      setSelSubject(''); setSelGrade(''); setExamDate(''); setStartTime(''); setEndTime('')
      loadData()
    } catch { setError('Erro de conexão') }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Cancelar esta prova? Os inscritos não serão notificados automaticamente.')) return
    await fetch(`/api/segunda-chamada/${id}`, { method: 'DELETE' })
    loadData()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1.5px solid rgba(97,206,112,0.2)', fontSize: 13,
    outline: 'none', fontFamily: 'inherit', color: '#0a1a0d', background: 'white',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#6b8f72',
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5,
  }

  // Agrupa provas por data
  const grouped = exams.reduce((acc, e) => {
    const key = formatDate(e.date)
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {} as Record<string, ExamSchedule[]>)

  return (
    <div style={{ minHeight: '100vh', background: '#f7fdf8' }}>
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
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[
              { href: '/secretaria',              icon: CalendarDays,  label: 'Agendamentos' },
              { href: '/secretaria/professores',  icon: Users,         label: 'Professores' },
              { href: '/secretaria/disciplinas',  icon: BookOpen,      label: 'Disciplinas' },
              { href: '/secretaria/segunda-chamada', icon: ClipboardList, label: 'Segunda Chamada', active: true },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: item.active ? 'rgba(255,255,255,0.15)' : 'transparent', color: item.active ? 'white' : 'rgba(255,255,255,0.6)' }}>
                  <item.icon style={{ width: 15, height: 15 }} />{item.label}
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
          <p style={{ color: '#6b8f72', fontSize: 13, marginTop: 4 }}>Agende datas de provas — os responsáveis poderão se inscrever pelo site</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)', gap: 24, alignItems: 'start' }}>

          {/* ── Formulário ── */}
          <div style={{ background: 'white', borderRadius: 18, border: '1.5px solid rgba(97,206,112,0.15)', padding: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.04)', position: 'sticky', top: 76 }}>
            <h3 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 700, fontSize: 16, color: '#0a1a0d', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus style={{ width: 16, height: 16, color: '#23A455' }} />
              Nova Prova
            </h3>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Série */}
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

              {/* Disciplina */}
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

              {/* Data */}
              <div>
                <label style={labelStyle}>Data da prova</label>
                <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#23A455'; e.target.style.boxShadow = '0 0 0 3px rgba(97,206,112,0.1)' }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              {/* Horários */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Início</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#23A455'; e.target.style.boxShadow = '0 0 0 3px rgba(97,206,112,0.1)' }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Fim</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#23A455'; e.target.style.boxShadow = '0 0 0 3px rgba(97,206,112,0.1)' }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13 }}>
                  <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
                  {error}
                  <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><X style={{ width: 13, height: 13 }} /></button>
                </div>
              )}

              <button type="submit" disabled={saving}
                style={{ padding: '12px', borderRadius: 10, border: 'none', background: saving ? 'rgba(97,206,112,0.2)' : 'linear-gradient(135deg,#23A455,#61CE70)', color: saving ? 'rgba(255,255,255,0.5)' : 'white', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: '"Roboto Slab",serif', boxShadow: saving ? 'none' : '0 4px 16px rgba(97,206,112,0.3)' }}>
                {saving ? 'Salvando...' : <><Plus style={{ width: 15, height: 15 }} />Adicionar Prova</>}
              </button>
            </form>
          </div>

          {/* ── Lista de provas ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {loading ? <LoadingSpinner /> : exams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', background: 'white', borderRadius: 20, border: '1.5px dashed rgba(97,206,112,0.3)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <p style={{ fontWeight: 600, color: '#3d5c42', fontSize: 16 }}>Nenhuma prova agendada</p>
                <p style={{ color: '#6b8f72', fontSize: 14, marginTop: 6 }}>Use o formulário ao lado para adicionar.</p>
              </div>
            ) : Object.entries(grouped).map(([dateLabel, dayExams]) => (
              <div key={dateLabel}>
                {/* Separador de data */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ height: 1, flex: 1, background: 'rgba(97,206,112,0.15)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1.5px solid rgba(97,206,112,0.2)', borderRadius: 999, padding: '5px 14px' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#23A455' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#3d5c42', textTransform: 'capitalize' }}>{dateLabel}</span>
                  </div>
                  <div style={{ height: 1, flex: 1, background: 'rgba(97,206,112,0.15)' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {dayExams.map(exam => (
                    <motion.div key={exam.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      style={{ background: 'white', borderRadius: 16, border: '1.5px solid rgba(97,206,112,0.12)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>

                      {/* Header do card */}
                      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#4054B2,#6b7fe8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ClipboardList style={{ width: 18, height: 18, color: 'white' }} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontWeight: 700, fontSize: 15, color: '#0a1a0d', margin: 0 }}>{exam.subjectName}</p>
                            <p style={{ fontSize: 12, color: '#6b8f72', margin: 0, marginTop: 2 }}>
                              {exam.grade} · {exam.startTime} – {exam.endTime}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#4054B2', background: '#eef1fb', borderRadius: 999, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Users2 style={{ width: 12, height: 12 }} />
                            {exam.bookings.length} inscrito{exam.bookings.length !== 1 ? 's' : ''}
                          </span>
                          <button onClick={() => setExpanded(expanded === exam.id ? null : exam.id)}
                            style={{ padding: 6, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 8, color: '#6b8f72' }}>
                            <motion.div animate={{ rotate: expanded === exam.id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronDown style={{ width: 15, height: 15 }} />
                            </motion.div>
                          </button>
                          <button onClick={() => handleDelete(exam.id)}
                            style={{ padding: 6, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 8, color: '#ef4444', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <Trash2 style={{ width: 15, height: 15 }} />
                          </button>
                        </div>
                      </div>

                      {/* Lista de inscritos */}
                      <AnimatePresence>
                        {expanded === exam.id && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                            <div style={{ borderTop: '1px solid rgba(97,206,112,0.1)', padding: '14px 18px', background: '#fafdfb' }}>
                              <p style={{ fontSize: 12, fontWeight: 700, color: '#3d5c42', marginBottom: 10 }}>
                                Inscritos ({exam.bookings.length})
                              </p>
                              {exam.bookings.length === 0 ? (
                                <p style={{ fontSize: 13, color: '#6b8f72' }}>Nenhum inscrito ainda.</p>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {exam.bookings.map((b, i) => (
                                    <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'white', borderRadius: 10, border: '1px solid rgba(97,206,112,0.1)' }}>
                                      <div>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: '#0a1a0d', margin: 0 }}>{b.studentName}</p>
                                        <p style={{ fontSize: 11, color: '#6b8f72', margin: 0 }}>Resp: {b.parentName} · {b.parentEmail}</p>
                                      </div>
                                      <span style={{ fontSize: 11, color: '#6b8f72' }}>#{i + 1}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
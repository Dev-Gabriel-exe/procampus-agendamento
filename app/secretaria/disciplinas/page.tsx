// app/secretaria/disciplinas/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { BookOpen, Plus, Trash2, CalendarDays, Users, LogOut, ChevronDown, AlertCircle, X, ClipboardList, BookMarked } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import RoleBadge from '@/components/secretaria/RoleBadge'
import type { Subject } from '@/types'

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

function DeleteModal({ open, name, onConfirm, onCancel }: { open: boolean; name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={onCancel}
        >
          <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
            onClick={e => e.stopPropagation()}
            style={{ background: 'white', borderRadius: 20, padding: 28, maxWidth: 360, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 style={{ width: 22, height: 22, color: '#ef4444' }} />
            </div>
            <h3 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 800, fontSize: 18, color: '#0a1a0d', textAlign: 'center', marginBottom: 8 }}>Apagar disciplina?</h3>
            <p style={{ fontSize: 13, color: '#6b8f72', textAlign: 'center', marginBottom: 20 }}>
              <strong style={{ color: '#3d5c42' }}>{name}</strong> será removida permanentemente.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onCancel} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid rgba(97,206,112,0.2)', background: 'white', color: '#3d5c42', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={onConfirm} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Apagar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function DisciplinasPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role ?? 'geral'

  const grades = role === 'fund1' ? GRADES_FUND1 : role === 'fund2' ? GRADES_FUND2 : GRADES_ALL

  const [subjects,         setSubjects]         = useState<Subject[]>([])
  const [loading,          setLoading]          = useState(true)
  const [newName,          setNewName]          = useState('')
  const [selDiscipline,    setSelDiscipline]    = useState('')
  const [selectedGrades,   setSelectedGrades]   = useState<string[]>([])
  const [saving,           setSaving]           = useState(false)
  const [error,            setError]            = useState('')
  const [deleteModal,      setDeleteModal]      = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' })
  const [expanded,         setExpanded]         = useState<string | null>(null)

  async function loadSubjects() {
    setLoading(true)
    try {
      const res = await fetch('/api/disciplinas')
      setSubjects(await res.json())
    } catch { console.error('Erro ao carregar disciplinas') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadSubjects() }, [])

  // Pega apenas os nomes únicos de disciplinas
  const uniqueDisciplines = Array.from(new Set(subjects.map(s => s.name))).sort()

  // Pega as séries que já têm a disciplina selecionada
  const gradesWithSelectedDiscipline = subjects
    .filter(s => s.name === selDiscipline)
    .map(s => s.grade)

  // Pega as séries que NÃO têm a disciplina selecionada (disponíveis para vincular)
  const availableGrades = grades.filter(g => !gradesWithSelectedDiscipline.includes(g))

  async function handleCreateDiscipline(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!newName.trim()) { setError('Digite o nome da disciplina.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/disciplinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), grades: [grades[0]] }), // Cria com a primeira série como referência
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao criar'); return }
      setNewName('')
      loadSubjects()
    } catch { setError('Erro de conexão') }
    finally { setSaving(false) }
  }

  async function handleLinkDiscipline(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!selDiscipline) { setError('Selecione uma disciplina.'); return }
    if (selectedGrades.length === 0) { setError('Selecione pelo menos uma série.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/disciplinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selDiscipline, grades: selectedGrades }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao vincular'); return }
      setSelectedGrades([])
      loadSubjects()
    } catch { setError('Erro de conexão') }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/disciplinas?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Erro ao apagar'); return }
      loadSubjects()
    } catch { alert('Erro de conexão') }
  }

  const grouped = grades.reduce((acc, grade) => {
    acc[grade] = subjects.filter(s => s.grade === grade)
    return acc
  }, {} as Record<string, Subject[]>)

  const totalDisciplinas = subjects.length

  return (
    <div style={{ minHeight: '100vh', background: '#f7fdf8' }}>

      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg,#0D2818 0%,#1a7a2e 100%)', borderBottom: '1px solid rgba(97,206,112,0.15)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Pro Campus" style={{ width: 34, height: 34, objectFit: 'contain', flexShrink: 0 }} />
              <div>
                <p style={{ fontFamily: 'var(--font-display),"Roboto Slab",serif', fontWeight: 800, color: 'white', fontSize: 15, lineHeight: 1, margin: 0 }}>Pro Campus</p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 2 }}>Secretaria</p>
              </div>
            </div>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {NAV_ITEMS.map(item => (
              <Link key={item.key} href={item.href} style={{ textDecoration: 'none' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: item.key === 'disciplinas' ? 'rgba(255,255,255,0.15)' : 'transparent', color: item.key === 'disciplinas' ? 'white' : 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
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

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-display),"Roboto Slab",serif', fontWeight: 800, fontSize: 24, color: '#0a1a0d', margin: 0 }}>Disciplinas</h2>
          <p style={{ color: '#6b8f72', fontSize: 13, marginTop: 4 }}>
            {totalDisciplinas} disciplina(s) cadastrada(s) · Aparecerão automaticamente no agendamento público
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,2fr)', gap: 24, alignItems: 'start' }}>

          {/* ── Painel Esquerdo: Criar Disciplina ── */}
          <div style={{ background: 'white', borderRadius: 18, border: '1.5px solid rgba(97,206,112,0.15)', padding: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.04)', position: 'sticky', top: 84 }}>
            <h3 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 700, fontSize: 16, color: '#0a1a0d', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus style={{ width: 16, height: 16, color: '#23A455' }} />
              Criar Disciplina
            </h3>

            <form onSubmit={handleCreateDiscipline} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b8f72', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Nome
                </label>
                <input
                  type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="Ex: Filosofia"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid rgba(97,206,112,0.2)', fontSize: 14, outline: 'none', fontFamily: 'inherit', color: '#0a1a0d', background: 'white' }}
                  onFocus={e => { e.target.style.borderColor = '#23A455'; e.target.style.boxShadow = '0 0 0 3px rgba(97,206,112,0.1)' }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              <button type="submit" disabled={saving || !newName.trim()}
                style={{
                  padding: '12px', borderRadius: 10, border: 'none',
                  background: (saving || !newName.trim()) ? 'rgba(97,206,112,0.2)' : 'linear-gradient(135deg,#23A455,#61CE70)',
                  color: (saving || !newName.trim()) ? 'rgba(255,255,255,0.5)' : 'white',
                  fontSize: 14, fontWeight: 700, cursor: (saving || !newName.trim()) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: '"Roboto Slab",serif', transition: 'all 0.2s',
                  boxShadow: (saving || !newName.trim()) ? 'none' : '0 4px 16px rgba(97,206,112,0.35)',
                }}>
                {saving ? (
                  <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin .7s linear infinite' }} />Criando...</>
                ) : (
                  <><Plus style={{ width: 15, height: 15 }} />Criar</>
                )}
              </button>
            </form>
          </div>

          {/* ── Painel Central: Vincular a Séries ── */}
          <div style={{ background: 'white', borderRadius: 18, border: '1.5px solid rgba(97,206,112,0.15)', padding: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.04)', position: 'sticky', top: 84 }}>
            <h3 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 700, fontSize: 16, color: '#0a1a0d', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen style={{ width: 16, height: 16, color: '#23A455' }} />
              Vincular Séries
            </h3>

            <form onSubmit={handleLinkDiscipline} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b8f72', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Disciplina
                </label>
                <div style={{ position: 'relative' }}>
                  <select value={selDiscipline} onChange={e => { setSelDiscipline(e.target.value); setSelectedGrades([]) }}
                    style={{ width: '100%', padding: '11px 36px 11px 14px', borderRadius: 10, border: '1.5px solid rgba(97,206,112,0.2)', fontSize: 14, outline: 'none', appearance: 'none', fontFamily: 'inherit', color: selDiscipline ? '#0a1a0d' : '#9ca3af', background: 'white', cursor: 'pointer' }}
                    onFocus={e => { e.target.style.borderColor = '#23A455'; e.target.style.boxShadow = '0 0 0 3px rgba(97,206,112,0.1)' }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.boxShadow = 'none' }}
                  >
                    <option value="">Selecione</option>
                    {uniqueDisciplines.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <ChevronDown style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#6b8f72', pointerEvents: 'none' }} />
                </div>
              </div>

              {selDiscipline && availableGrades.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6b8f72', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    Séries ({selectedGrades.length} selecionadas)
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto', paddingRight: 8 }}>
                    {availableGrades.map(grade => (
                      <label key={grade} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 10px', borderRadius: 8, background: selectedGrades.includes(grade) ? '#f0faf2' : 'transparent', transition: 'background 0.15s' }}>
                        <input
                          type="checkbox"
                          checked={selectedGrades.includes(grade)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedGrades([...selectedGrades, grade])
                            } else {
                              setSelectedGrades(selectedGrades.filter(g => g !== grade))
                            }
                          }}
                          style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#23A455' }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#3d5c42' }}>{grade}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selDiscipline && availableGrades.length === 0 && (
                <div style={{ padding: '12px', background: '#f0faf2', borderRadius: 10, border: '1px solid rgba(97,206,112,0.2)', fontSize: 13, color: '#3d5c42' }}>
                  ✓ Já está em todas as séries disponíveis
                </div>
              )}

              <button type="submit" disabled={saving || !selDiscipline || selectedGrades.length === 0}
                style={{
                  padding: '12px', borderRadius: 10, border: 'none',
                  background: (saving || !selDiscipline || selectedGrades.length === 0) ? 'rgba(97,206,112,0.2)' : 'linear-gradient(135deg,#23A455,#61CE70)',
                  color: (saving || !selDiscipline || selectedGrades.length === 0) ? 'rgba(255,255,255,0.5)' : 'white',
                  fontSize: 14, fontWeight: 700, cursor: (saving || !selDiscipline || selectedGrades.length === 0) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: '"Roboto Slab",serif', transition: 'all 0.2s',
                  boxShadow: (saving || !selDiscipline || selectedGrades.length === 0) ? 'none' : '0 4px 16px rgba(97,206,112,0.35)',
                }}>
                {saving ? (
                  <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin .7s linear infinite' }} />Vinculando...</>
                ) : (
                  <><Plus style={{ width: 15, height: 15 }} />Vincular</>
                )}
              </button>
            </form>
          </div>

          {/* ── Painel Direito: Lista por série ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading ? <LoadingSpinner /> : grades.map(grade => {
              const subs = grouped[grade] || []
              const isOpen = expanded === grade

              return (
                <div key={grade} style={{ background: 'white', borderRadius: 14, border: '1.5px solid rgba(97,206,112,0.12)', overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : grade)}
                    style={{ width: '100%', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: subs.length > 0 ? '#23A455' : '#d1d5db', flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#0a1a0d' }}>{grade}</span>
                      <span style={{ fontSize: 12, color: '#6b8f72', background: '#f0faf2', borderRadius: 999, padding: '2px 8px', border: '1px solid rgba(97,206,112,0.2)' }}>
                        {subs.length} disciplina{subs.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown style={{ width: 15, height: 15, color: '#6b8f72' }} />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                        <div style={{ borderTop: '1px solid rgba(97,206,112,0.1)', padding: '12px 20px 16px' }}>
                          {subs.length === 0 ? (
                            <p style={{ fontSize: 13, color: '#6b8f72', fontStyle: 'italic' }}>
                              Nenhuma disciplina cadastrada para esta série.
                            </p>
                          ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {subs.map(sub => (
                                <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0faf2', borderRadius: 8, padding: '7px 12px', border: '1px solid rgba(97,206,112,0.2)' }}>
                                  <BookOpen style={{ width: 12, height: 12, color: '#23A455', flexShrink: 0 }} />
                                  <span style={{ fontSize: 13, fontWeight: 600, color: '#3d5c42' }}>{sub.name}</span>
                                  <button
                                    onClick={() => setDeleteModal({ open: true, id: sub.id, name: `${sub.name} — ${sub.grade}` })}
                                    style={{ padding: '2px 4px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4, color: '#ef4444', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                  >
                                    <Trash2 style={{ width: 11, height: 11 }} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      <DeleteModal
        open={deleteModal.open}
        name={deleteModal.name}
        onConfirm={() => { handleDelete(deleteModal.id); setDeleteModal({ open: false, id: '', name: '' }) }}
        onCancel={() => setDeleteModal({ open: false, id: '', name: '' })}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
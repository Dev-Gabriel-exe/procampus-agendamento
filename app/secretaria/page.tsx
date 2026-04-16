// app/secretaria/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { CalendarDays, Users, LogOut, CheckCircle, XCircle, Clock, Menu, X, BookOpen, ClipboardList, BookMarked } from 'lucide-react'
import AgendamentoCard from '@/components/secretaria/AgendamentoCard'
import FiltrosSemana, { type Filtros } from '@/components/secretaria/FiltrosSemana'
import PrintView from '@/components/secretaria/PrintView'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import RoleBadge from '@/components/secretaria/RoleBadge'
import { extractTurma } from '@/lib/turmas'
export const dynamic = 'force-dynamic'

type AppointmentFull = {
  id: string; date: Date | string; startTime: string; endTime: string
  parentName: string; parentEmail: string; parentPhone: string; reason: string
  studentName: string; studentGrade: string; subjectName: string; status: string; createdAt: Date
  availability: { dayOfWeek: number; startTime: string; endTime: string; teacher: { name: string; phone: string; email: string } }
}

const NAV_ITEMS = [
  { href: '/secretaria',               icon: CalendarDays,  label: 'Agendamentos',    key: 'dashboard' },
  { href: '/secretaria/professores',   icon: Users,         label: 'Professores',     key: 'professores' },
  { href: '/secretaria/disciplinas',   icon: BookOpen,      label: 'Disciplinas',     key: 'disciplinas' },
  { href: '/secretaria/segunda-chamada', icon: ClipboardList, label: 'Segunda Chamada', key: 'segunda-chamada' },
  { href: '/secretaria/recuperacao', icon: BookMarked, label: 'Recuperação', key: 'recuperacao' },
]

function SecretariaNav({ active }: { active: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <>
      <header className="no-print" style={{ background: 'linear-gradient(135deg,#0D2818 0%,#1a7a2e 100%)', borderBottom: '1px solid rgba(97,206,112,0.15)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Pro Campus" style={{ width: 34, height: 34, objectFit: 'contain', display: 'block', flexShrink: 0 }} />
              <div>
                <p style={{ fontFamily: 'var(--font-display),"Roboto Slab",serif', fontWeight: 800, color: 'white', fontSize: 15, lineHeight: 1, margin: 0 }}>Pro Campus</p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 2 }}>Secretaria</p>
              </div>
            </div>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="desktop-nav">
            {NAV_ITEMS.map(item => (
              <Link key={item.key} href={item.href} style={{ textDecoration: 'none' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: active === item.key ? 'rgba(255,255,255,0.15)' : 'transparent', color: active === item.key ? 'white' : 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
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

          <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-menu-btn" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {menuOpen ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
            className="mobile-menu no-print"
            style={{ position: 'fixed', top: 60, left: 0, right: 0, zIndex: 49, background: '#0D2818', borderBottom: '1px solid rgba(97,206,112,0.2)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_ITEMS.map(item => (
              <Link key={item.key} href={item.href} style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
                <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, background: active === item.key ? 'rgba(97,206,112,0.2)' : 'transparent', color: active === item.key ? '#61CE70' : 'rgba(255,255,255,0.8)' }}>
                  <item.icon style={{ width: 18, height: 18 }} />{item.label}
                </button>
              </Link>
            ))}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
            <div style={{ padding: '8px 16px' }}><RoleBadge /></div>
            <button onClick={() => signOut({ callbackUrl: '/secretaria/login' })} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, background: 'transparent', color: 'rgba(255,255,255,0.5)' }}>
              <LogOut style={{ width: 18, height: 18 }} />Sair
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .desktop-nav{display:flex;}.mobile-menu-btn{display:none;}.mobile-menu{display:flex;}
        @media(max-width:768px){.desktop-nav{display:none!important;}.mobile-menu-btn{display:flex!important;}}
        @media(min-width:769px){.mobile-menu{display:none!important;}}
      `}</style>
    </>
  )
}

function StatCard({ label, value, icon: Icon, color, bg }: { label: string; value: number; icon: any; color: string; bg: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'white', borderRadius: 14, border: '1.5px solid rgba(97,206,112,0.1)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 18, height: 18, color }} />
      </div>
      <div>
        <p style={{ fontFamily: 'var(--font-display),"Roboto Slab",serif', fontWeight: 800, fontSize: 22, color: '#0a1a0d', lineHeight: 1, margin: 0 }}>{value}</p>
        <p style={{ color: '#6b8f72', fontSize: 11, marginTop: 3 }}>{label}</p>
      </div>
    </motion.div>
  )
}

export default function SecretariaPage() {
  const [appointments, setAppointments] = useState<AppointmentFull[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState<Filtros>({ search: '', dateFrom: '', dateTo: '', grade: '', discipline: '', turma: '' })
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/agendamentos')
      setAppointments(await res.json())
    } catch { console.error('Erro ao buscar agendamentos') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  async function handleCancel(id: string) {
    if (!confirm('Cancelar este agendamento? O responsável será notificado por e-mail.')) return
    await fetch(`/api/agendamentos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) })
    fetchAppointments()
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }

  async function handleDelete(id: string) {
    // Se há seleções e este ID está selecionado, deletar todos os selecionados
    if (selected.size > 0 && selected.has(id)) {
      const count = selected.size
      if (!confirm(`Deletar ${count} agendamento${count > 1 ? 's' : ''}? Esta ação não pode ser desfeita.`)) return
      await Promise.all(Array.from(selected).map(selectedId =>
        fetch(`/api/agendamentos/${selectedId}`, { method: 'DELETE' })
      ))
      setSelected(new Set())
      fetchAppointments()
    } else {
      // Deletar apenas este
      await fetch(`/api/agendamentos/${id}`, { method: 'DELETE' })
      fetchAppointments()
    }
  }

  const filtered = appointments.filter(a => {
    const q = filtros.search.toLowerCase()
    if (q && !(a.parentName.toLowerCase().includes(q) || a.studentName.toLowerCase().includes(q) || a.availability.teacher.name.toLowerCase().includes(q) || a.studentGrade.toLowerCase().includes(q))) return false
    if (filtros.dateFrom && new Date(a.date).toISOString().split('T')[0] < filtros.dateFrom) return false
    if (filtros.dateTo   && new Date(a.date).toISOString().split('T')[0] > filtros.dateTo)   return false
    if (filtros.grade      && a.studentGrade !== filtros.grade)      return false
    if (filtros.discipline && a.subjectName  !== filtros.discipline) return false
    if (filtros.turma      && extractTurma(a.studentGrade) !== filtros.turma) return false
    return true
  })

  const confirmed    = filtered.filter(a => a.status === 'confirmed')
  const cancelled    = filtered.filter(a => a.status === 'cancelled')
  const disciplines  = [...new Set(appointments.map(a => a.subjectName).filter(Boolean))].sort()
  const turmas       = [...new Set(appointments.map(a => extractTurma(a.studentGrade)).filter(Boolean))].sort()

  return (
    <div style={{ minHeight: '100vh', background: '#f7fdf8' }}>
      <SecretariaNav active="dashboard" />
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 16px 40px' }}>
        <div style={{ marginBottom: 16 }}>
          <FiltrosSemana filtros={filtros} onFiltros={setFiltros} disciplines={disciplines} turmas={turmas} totalFiltrado={filtered.length} totalGeral={appointments.length} onPrint={() => window.print()} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }} className="no-print stats-grid">
          <StatCard label="Confirmados" value={confirmed.length} icon={CheckCircle} color="#23A455" bg="#e8f9eb" />
          <StatCard label="Cancelados"  value={cancelled.length} icon={XCircle}     color="#dc2626" bg="#fef2f2" />
          <StatCard label="Total"       value={filtered.length}  icon={Clock}        color="#4054B2" bg="#eef1fb" />
        </div>
        <PrintView filtros={filtros} total={filtered.length} confirmed={confirmed.length} cancelled={cancelled.length} />
        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '60px 24px', background: 'white', borderRadius: 20, border: '1.5px dashed rgba(97,206,112,0.3)' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>📅</div>
            <p style={{ fontWeight: 600, color: '#3d5c42', fontSize: 16 }}>Nenhum agendamento encontrado</p>
            <p style={{ color: '#6b8f72', fontSize: 14, marginTop: 6 }}>{filtros.search || filtros.dateFrom || filtros.dateTo || filtros.grade || filtros.discipline ? 'Tente ajustar os filtros.' : 'Quando os pais agendarem, aparecerão aqui.'}</p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {Object.entries(filtered.reduce((acc, a) => {
              const key = new Date(a.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Fortaleza' })
              if (!acc[key]) acc[key] = []; acc[key].push(a); return acc
            }, {} as Record<string, AppointmentFull[]>))
            .sort(([a], [b]) => {
              const dA = filtered.find(f => new Date(f.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Fortaleza' }) === a)!
              const dB = filtered.find(f => new Date(f.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Fortaleza' }) === b)!
              return new Date(dA.date).getTime() - new Date(dB.date).getTime()
            })
            .map(([dateLabel, appts]) => (
              <div key={dateLabel}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ height: 1, flex: 1, background: 'rgba(97,206,112,0.15)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1.5px solid rgba(97,206,112,0.2)', borderRadius: 999, padding: '5px 14px' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#23A455' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#3d5c42', textTransform: 'capitalize' }}>{dateLabel}</span>
                    <span style={{ fontSize: 11, color: '#6b8f72', background: '#f0faf2', borderRadius: 999, padding: '1px 8px' }}>{appts.length}</span>
                  </div>
                  <div style={{ height: 1, flex: 1, background: 'rgba(97,206,112,0.15)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
                  <AnimatePresence>
                    {appts.map((appt, i) => <AgendamentoCard key={appt.id} appt={appt} onCancel={handleCancel} onDelete={handleDelete} index={i} isSelected={selected.has(appt.id)} onToggleSelect={toggleSelect} hasMultipleSelected={selected.size > 0} />)}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <style>{`@media(max-width:480px){.stats-grid{grid-template-columns:1fr!important;}}`}</style>
    </div>
  )
}
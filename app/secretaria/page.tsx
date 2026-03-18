'use client'

import { useState, useEffect, useCallback } from 'react'
import { signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { CalendarDays, Users, LogOut, CheckCircle, XCircle, Clock } from 'lucide-react'
import AgendamentoCard from '@/components/secretaria/AgendamentoCard'
import FiltrosSemana   from '@/components/secretaria/FiltrosSemana'
import PrintView       from '@/components/secretaria/PrintView'
import LoadingSpinner  from '@/components/ui/LoadingSpinner'
import { getWeekRange } from '@/lib/slots'
import type { Appointment } from '@/types'


type AppointmentFull = {
  id: string
  date: Date | string
  startTime: string
  endTime: string
  parentName: string
  parentEmail: string
  parentPhone: string
  reason: string
  studentName: string
  studentGrade: string
  status: string
  createdAt: Date
  availability: {
    dayOfWeek: number
    startTime: string
    endTime: string
    teacher: { name: string; phone: string; email: string }
  }
}

// ── Navbar da Secretaria ──────────────────────────────────
function SecretariaNav({ active }: { active: 'dashboard' | 'professores' }) {
  return (
    <header
      className="no-print"
      style={{
        background: 'linear-gradient(135deg, #0D2818 0%, #1a7a2e 100%)',
        borderBottom: '1px solid rgba(97,206,112,0.15)',
        position: 'sticky', top: 0, zIndex: 50,
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Pro Campus"
            style={{ width: 36, height: 36, objectFit: 'contain', display: 'block', flexShrink: 0 }}
          />
          <div>
            <p style={{ fontFamily: 'var(--font-display),"Roboto Slab",serif', fontWeight: 800, color: 'white', fontSize: 15, lineHeight: 1 }}>
              Pro Campus
            </p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 }}>Secretaria</p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Link href="/secretaria">
            <button style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
              background: active === 'dashboard' ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: active === 'dashboard' ? 'white' : 'rgba(255,255,255,0.6)',
            }}>
              <CalendarDays style={{ width: 15, height: 15 }} />
              Agendamentos
            </button>
          </Link>
          <Link href="/secretaria/professores">
            <button style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
              background: active === 'professores' ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: active === 'professores' ? 'white' : 'rgba(255,255,255,0.6)',
            }}>
              <Users style={{ width: 15, height: 15 }} />
              Professores
            </button>
          </Link>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.12)', margin: '0 4px' }} />
          <button
            onClick={() => signOut({ callbackUrl: '/secretaria/login' })}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 13, background: 'transparent', color: 'rgba(255,255,255,0.5)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
          >
            <LogOut style={{ width: 15, height: 15 }} />
            Sair
          </button>
        </nav>
      </div>
    </header>
  )
}

// ── Stat Card ─────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, bg }: {
  label: string; value: number
  icon: any; color: string; bg: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'white', borderRadius: 16,
        border: '1.5px solid rgba(97,206,112,0.1)',
        padding: '20px 24px',
        display: 'flex', alignItems: 'center', gap: 16,
        boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 20, height: 20, color }} />
      </div>
      <div>
        <p style={{ fontFamily: 'var(--font-display),"Roboto Slab",serif', fontWeight: 800, fontSize: 26, color: '#0a1a0d', lineHeight: 1 }}>
          {value}
        </p>
        <p style={{ color: '#6b8f72', fontSize: 12, marginTop: 4 }}>{label}</p>
      </div>
    </motion.div>
  )
}

// ── Página principal ──────────────────────────────────────
export default function SecretariaPage() {
  const [appointments, setAppointments] = useState<AppointmentFull[]>([])
  const [loading,      setLoading]      = useState(true)
  const [currentWeek,  setCurrentWeek]  = useState(new Date())
  const [search,       setSearch]       = useState('')

  const { start, end } = getWeekRange(currentWeek)

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/agendamentos?weekStart=${start.toISOString()}&weekEnd=${end.toISOString()}`
      )
      setAppointments(await res.json())
    } catch { console.error('Erro ao buscar agendamentos') }
    finally { setLoading(false) }
  }, [start.toISOString(), end.toISOString()])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  async function handleCancel(id: string) {
    if (!confirm('Cancelar este agendamento?')) return
    await fetch(`/api/agendamentos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
    fetchAppointments()
  }

  const filtered = appointments.filter(a => {
    const q = search.toLowerCase()
    return (
      a.parentName.toLowerCase().includes(q) ||
      a.studentName.toLowerCase().includes(q) ||
      a.availability.teacher.name.toLowerCase().includes(q) ||
      a.studentGrade.toLowerCase().includes(q)
    )
  })

  const confirmed = filtered.filter(a => a.status === 'confirmed')
  const cancelled = filtered.filter(a => a.status === 'cancelled')

  return (
    <div style={{ minHeight: '100vh', background: '#f7fdf8' }}>
      <SecretariaNav active="dashboard" />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>

        {/* Filtros */}
        <div style={{ marginBottom: 28 }}>
          <FiltrosSemana
            currentWeek={currentWeek}
            weekStart={start}
            weekEnd={end}
            search={search}
            onSearch={setSearch}
            onPrev={() => { const d = new Date(currentWeek); d.setDate(d.getDate() - 7); setCurrentWeek(d) }}
            onNext={() => { const d = new Date(currentWeek); d.setDate(d.getDate() + 7); setCurrentWeek(d) }}
            onToday={() => setCurrentWeek(new Date())}
          />
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }} className="no-print">
          <StatCard label="Confirmados" value={confirmed.length} icon={CheckCircle} color="#23A455" bg="#e8f9eb" />
          <StatCard label="Cancelados"  value={cancelled.length} icon={XCircle}     color="#dc2626" bg="#fef2f2" />
          <StatCard label="Total"       value={filtered.length}  icon={Clock}        color="#4054B2" bg="#eef1fb" />
        </div>

        {/* Print header */}
        <PrintView weekStart={start} weekEnd={end} total={filtered.length} confirmed={confirmed.length} />

        {/* Cards */}
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              textAlign: 'center', padding: '72px 24px',
              background: 'white', borderRadius: 20,
              border: '1.5px dashed rgba(97,206,112,0.3)',
            }}
          >
            <div style={{ fontSize: 52, marginBottom: 16 }}>📅</div>
            <p style={{ fontWeight: 600, color: '#3d5c42', fontSize: 16 }}>
              Nenhum agendamento esta semana
            </p>
            <p style={{ color: '#6b8f72', fontSize: 14, marginTop: 6 }}>
              {search ? 'Tente uma busca diferente.' : 'Quando os pais agendarem, aparecerão aqui.'}
            </p>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: 20 }}>
            <AnimatePresence>
              {filtered.map((appt, i) => (
                <AgendamentoCard key={appt.id} appt={appt} onCancel={handleCancel} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  )
}
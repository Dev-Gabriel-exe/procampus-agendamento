// ============================================================
// ARQUIVO: src/app/secretaria/professores/page.tsx
// CAMINHO: procampus-agendamento/src/app/secretaria/professores/page.tsx
// SUBSTITUA o arquivo inteiro
// ============================================================

'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Users, CalendarDays, LogOut, Plus, BookOpen, ClipboardList } from 'lucide-react'
import ProfessorModal      from '@/components/secretaria/ProfessorModal'
import ProfessorTable      from '@/components/secretaria/ProfessorTable'
import DisponibilidadeForm from '@/components/secretaria/DisponibilidadeForm'
import LoadingSpinner      from '@/components/ui/LoadingSpinner'
import RoleBadge           from '@/components/secretaria/RoleBadge'
import type { Teacher, Subject } from '@/types'

export const dynamic = 'force-dynamic'

type TeacherFull = Teacher & {
  subjects: { subject: Subject }[]
  availabilities?: { id: string; date: string; startTime: string; endTime: string; slots: { id: string; isBooked: boolean }[] }[]
}

const NAV_ITEMS = [
  { href: '/secretaria',                 icon: CalendarDays,  label: 'Agendamentos',     key: 'dashboard' },
  { href: '/secretaria/professores',     icon: Users,         label: 'Professores',      key: 'professores' },
  { href: '/secretaria/disciplinas',     icon: BookOpen,      label: 'Disciplinas',      key: 'disciplinas' },
  { href: '/secretaria/segunda-chamada', icon: ClipboardList, label: 'Segunda Chamada',  key: 'segunda-chamada' },
]

export default function ProfessoresPage() {
  const [teachers,    setTeachers]    = useState<TeacherFull[]>([])
  const [subjects,    setSubjects]    = useState<Subject[]>([])
  const [loading,     setLoading]     = useState(true)
  const [expanded,    setExpanded]    = useState<string | null>(null)
  const [profModal,   setProfModal]   = useState(false)
  const [editTeacher, setEditTeacher] = useState<TeacherFull | null>(null)
  const [dispModal,   setDispModal]   = useState(false)
  const [dispTeacher, setDispTeacher] = useState<Teacher | null>(null)

  async function loadData() {
    setLoading(true)
    try {
      const [tRes, sRes, aRes] = await Promise.all([fetch('/api/professores'), fetch('/api/disciplinas'), fetch('/api/disponibilidade-prof')])
      const [tData, sData, aData] = await Promise.all([tRes.json(), sRes.json(), aRes.json()])
      setTeachers(tData.map((t: TeacherFull) => ({ ...t, availabilities: aData.filter((a: any) => a.teacherId === t.id) })))
      setSubjects(sData)
    } catch { console.error('Erro ao carregar dados') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  async function handleDelete(id: string) {
    if (!confirm('Excluir este professor? Todos os horários serão removidos.')) return
    await fetch(`/api/professores/${id}`, { method: 'DELETE' })
    loadData()
  }

  async function handleDeleteAvailability(id: string) {
    if (!confirm('Remover esta disponibilidade?')) return
    await fetch(`/api/disponibilidade-prof/${id}`, { method: 'DELETE' })
    loadData()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7fdf8' }}>
      <header style={{ background: 'linear-gradient(135deg,#0D2818 0%,#1a7a2e 100%)', borderBottom: '1px solid rgba(97,206,112,0.15)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Pro Campus" style={{ width: 34, height: 34, objectFit: 'contain', flexShrink: 0 }} />
              <div>
                <p style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 800, color: 'white', fontSize: 15, lineHeight: 1, margin: 0 }}>Pro Campus</p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 2 }}>Secretaria</p>
              </div>
            </div>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {NAV_ITEMS.map(item => (
              <Link key={item.key} href={item.href} style={{ textDecoration: 'none' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: item.key === 'professores' ? 'rgba(255,255,255,0.15)' : 'transparent', color: item.key === 'professores' ? 'white' : 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h2 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 800, fontSize: 24, color: '#0a1a0d' }}>Professores</h2>
            <p style={{ color: '#6b8f72', fontSize: 13, marginTop: 4 }}>{teachers.length} professor(es) cadastrado(s)</p>
          </div>
          <motion.button whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }} onClick={() => { setEditTeacher(null); setProfModal(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#23A455,#61CE70)', color: 'white', border: 'none', borderRadius: 12, padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(97,206,112,0.35)' }}>
            <Plus style={{ width: 16, height: 16 }} />Novo Professor
          </motion.button>
        </div>

        {loading ? <LoadingSpinner /> : (
          <ProfessorTable
            teachers={teachers} expanded={expanded}
            onToggleExpand={id => setExpanded(expanded === id ? null : id)}
            onEdit={t => { setEditTeacher(t as any); setProfModal(true) }}
            onDelete={handleDelete}
            onAddDisponibilidade={t => { setDispTeacher(t as any); setDispModal(true) }}
            onDeleteAvailability={handleDeleteAvailability}
          />
        )}
      </main>

      <ProfessorModal open={profModal} teacher={editTeacher} subjects={subjects} onClose={() => { setProfModal(false); setEditTeacher(null) }} onSave={loadData} />
      <DisponibilidadeForm open={dispModal} teacher={dispTeacher} onClose={() => { setDispModal(false); setDispTeacher(null) }} onSave={loadData} />
    </div>
  )
}
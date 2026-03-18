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
import { Users, CalendarDays, LogOut, Plus } from 'lucide-react'
import ProfessorModal      from '@/components/secretaria/ProfessorModal'
import ProfessorTable      from '@/components/secretaria/ProfessorTable'
import DisponibilidadeForm from '@/components/secretaria/DisponibilidadeForm'
import LoadingSpinner      from '@/components/ui/LoadingSpinner'
import type { Teacher, Subject } from '@/types'

type TeacherFull = Teacher & {
  subjects: { subject: Subject }[]
  availabilities?: {
    id: string; date: string; startTime: string; endTime: string
    slots: { id: string; isBooked: boolean }[]
  }[]
}

export default function ProfessoresPage() {
  const [teachers,     setTeachers]     = useState<TeacherFull[]>([])
  const [subjects,     setSubjects]     = useState<Subject[]>([])
  const [loading,      setLoading]      = useState(true)
  const [expanded,     setExpanded]     = useState<string | null>(null)

  // Modal professor
  const [profModal,    setProfModal]    = useState(false)
  const [editTeacher,  setEditTeacher]  = useState<TeacherFull | null>(null)

  // Modal disponibilidade
  const [dispModal,    setDispModal]    = useState(false)
  const [dispTeacher,  setDispTeacher]  = useState<Teacher | null>(null)

  async function loadData() {
    setLoading(true)
    try {
      const [tRes, sRes, aRes] = await Promise.all([
        fetch('/api/professores'),
        fetch('/api/disciplinas'),
        fetch('/api/disponibilidade-prof'),
      ])
      const tData = await tRes.json()
      const sData = await sRes.json()
      const aData = await aRes.json()

      setTeachers(
        tData.map((t: TeacherFull) => ({
          ...t,
          availabilities: aData.filter((a: any) => a.teacherId === t.id),
        }))
      )
      setSubjects(sData)
    } catch { console.error('Erro ao carregar dados') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  function openNewTeacher() {
    setEditTeacher(null)
    setProfModal(true)
  }

  function openEditTeacher(t: TeacherFull) {
    setEditTeacher(t)
    setProfModal(true)
  }

  function openDisponibilidade(t: Teacher) {
    setDispTeacher(t)
    setDispModal(true)
  }

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

      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg,#0D2818 0%,#1a7a2e 100%)',
        borderBottom: '1px solid rgba(97,206,112,0.15)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Pro Campus"
              style={{ width: 36, height: 36, objectFit: 'contain', display: 'block', flexShrink: 0 }}
            />
            <div>
              <p style={{ fontFamily: 'var(--font-display),"Roboto Slab",serif', fontWeight: 800, color: 'white', fontSize: 15, lineHeight: 1 }}>Pro Campus</p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 }}>Secretaria</p>
            </div>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Link href="/secretaria">
              <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: 'transparent', color: 'rgba(255,255,255,0.6)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}>
                <CalendarDays style={{ width: 15, height: 15 }} />Agendamentos
              </button>
            </Link>
            <Link href="/secretaria/professores">
              <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                <Users style={{ width: 15, height: 15 }} />Professores
              </button>
            </Link>
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.12)', margin: '0 4px' }} />
            <button onClick={() => signOut({ callbackUrl: '/secretaria/login' })}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, background: 'transparent', color: 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}>
              <LogOut style={{ width: 15, height: 15 }} />Sair
            </button>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-display),"Roboto Slab",serif',
              fontWeight: 800, fontSize: 24, color: '#0a1a0d',
            }}>
              Professores
            </h2>
            <p style={{ color: '#6b8f72', fontSize: 13, marginTop: 4 }}>
              {teachers.length} professor(es) cadastrado(s)
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={openNewTeacher}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg,#23A455,#61CE70)',
              color: 'white', border: 'none', borderRadius: 12,
              padding: '11px 22px', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 4px 20px rgba(97,206,112,0.35)',
            }}
          >
            <Plus style={{ width: 16, height: 16 }} />
            Novo Professor
          </motion.button>
        </div>

        {/* Tabela */}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <ProfessorTable
            teachers={teachers}
            expanded={expanded}
            onToggleExpand={id => setExpanded(expanded === id ? null : id)}
            onEdit={openEditTeacher}
            onDelete={handleDelete}
            onAddDisponibilidade={openDisponibilidade}
            onDeleteAvailability={handleDeleteAvailability}
          />
        )}
      </main>

      {/* Modal professor */}
      <ProfessorModal
        open={profModal}
        teacher={editTeacher}
        subjects={subjects}
        onClose={() => { setProfModal(false); setEditTeacher(null) }}
        onSave={loadData}
      />

      {/* Modal disponibilidade */}
      <DisponibilidadeForm
        open={dispModal}
        teacher={dispTeacher}
        onClose={() => { setDispModal(false); setDispTeacher(null) }}
        onSave={loadData}
      />
    </div>
  )
}
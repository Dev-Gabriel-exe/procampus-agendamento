'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Phone, Check, AlertCircle } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { Teacher, Subject } from '@/types'

type TeacherFull = Teacher & { subjects: { subject: Subject }[] }

interface ProfessorModalProps {
  open: boolean
  teacher?: TeacherFull | null
  subjects: Subject[]
  onClose: () => void
  onSave: () => void
}

export default function ProfessorModal({
  open, teacher, subjects, onClose, onSave,
}: ProfessorModalProps) {
  const [name,     setName]     = useState(teacher?.name || '')
  const [email,    setEmail]    = useState(teacher?.email || '')
  const [phone,    setPhone]    = useState(teacher?.phone || '')
  const [selected, setSelected] = useState<string[]>(
    teacher?.subjects.map(s => s.subject.id) || []
  )
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await fetch(
        teacher ? `/api/professores/${teacher.id}` : '/api/professores',
        {
          method: teacher ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, subjectIds: selected }),
        }
      )
      if (!res.ok) { setError((await res.json()).error || 'Erro ao salvar'); return }
      onSave(); onClose()
    } catch { setError('Erro de conexão') }
    finally { setLoading(false) }
  }

  // Agrupa disciplinas por nome
  const grouped = subjects.reduce((acc, s) => {
    if (!acc[s.name]) acc[s.name] = []
    acc[s.name].push(s)
    return acc
  }, {} as Record<string, Subject[]>)

  return (
    <Modal
      open={open} onClose={onClose}
      title={teacher ? 'Editar Professor' : 'Novo Professor'}
      subtitle={teacher ? `Editando dados de ${teacher.name}` : 'Preencha os dados do professor'}
      maxWidth={540}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <Input
          label="Nome completo"
          value={name} onChange={e => setName(e.target.value)}
          required placeholder="Ex: Maria da Silva"
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input
            label="E-mail"
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            required placeholder="prof@email.com"
            icon={<Mail style={{ width: 15, height: 15 }} />}
          />
          <Input
            label="WhatsApp"
            value={phone} onChange={e => setPhone(e.target.value)}
            required placeholder="5586999999999"
            hint="Com código do país: 55"
            icon={<Phone style={{ width: 15, height: 15 }} />}
          />
        </div>

        {/* Disciplinas */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#3d5c42', marginBottom: 8 }}>
            Disciplinas / Séries
          </p>
          <div style={{
            border: '1.5px solid rgba(97,206,112,0.2)',
            borderRadius: 12, overflow: 'hidden',
            maxHeight: 220, overflowY: 'auto',
          }}>
            {Object.entries(grouped).map(([groupName, subs]) => (
              <div key={groupName}>
                <div style={{ background: '#f7fdf8', padding: '8px 16px', borderBottom: '1px solid rgba(97,206,112,0.1)' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#23A455', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    {groupName}
                  </span>
                </div>
                {subs.map(sub => (
                  <label key={sub.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 16px', cursor: 'pointer',
                    borderBottom: '1px solid rgba(97,206,112,0.06)',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f7fdf8'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div
                      onClick={() => toggle(sub.id)}
                      style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                        border: `2px solid ${selected.includes(sub.id) ? '#23A455' : '#c8d8ca'}`,
                        background: selected.includes(sub.id) ? '#23A455' : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}
                    >
                      {selected.includes(sub.id) && <Check style={{ width: 11, height: 11, color: 'white' }} />}
                    </div>
                    <span style={{ fontSize: 13, color: '#3d5c42' }}>{sub.grade}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#6b8f72', marginTop: 6 }}>
            {selected.length} disciplina(s) selecionada(s)
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#fef2f2', border: '1px solid rgba(239,68,68,0.2)',
            color: '#dc2626', padding: '12px 16px', borderRadius: 10, fontSize: 13,
          }}>
            <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
          <Button variant="outline" onClick={onClose} type="button" style={{ flex: 1 }}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" loading={loading} style={{ flex: 1 }}>
            {teacher ? 'Salvar alterações' : 'Cadastrar professor'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

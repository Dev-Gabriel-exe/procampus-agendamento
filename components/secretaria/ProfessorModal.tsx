// components/secretaria/ProfessorModal.tsx
'use client'
 
import { useState, useEffect } from 'react'
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
 
function applyPhoneMask(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 13)
  if (digits.length <= 2)  return digits
  if (digits.length <= 4)  return `+${digits.slice(0,2)} (${digits.slice(2)}`
  if (digits.length <= 9)  return `+${digits.slice(0,2)} (${digits.slice(2,4)}) ${digits.slice(4)}`
  if (digits.length <= 13) return `+${digits.slice(0,2)} (${digits.slice(2,4)}) ${digits.slice(4,9)}-${digits.slice(9)}`
  return value
}
 
export default function ProfessorModal({
  open, teacher, subjects, onClose, onSave,
}: ProfessorModalProps) {
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
 
  useEffect(() => {
    if (open) {
      setName(teacher?.name || '')
      setEmail(teacher?.email || '')
      setPhone(teacher?.phone ? applyPhoneMask(teacher.phone) : '')
      setSelected(teacher?.subjects.map(s => s.subject!.id) || [])
      setError('')
    }
  }, [open, teacher])
 
  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
 
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const rawPhone = phone.replace(/\D/g, '')
    try {
      const res = await fetch(
        teacher ? `/api/professores/${teacher.id}` : '/api/professores',
        {
          method: teacher ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone: rawPhone, subjectIds: selected }),
        }
      )
      if (!res.ok) { setError((await res.json()).error || 'Erro ao salvar'); return }
      onSave(); onClose()
    } catch { setError('Erro de conexão') }
    finally { setLoading(false) }
  }
 
  // ✅ FIX: deduplica subjects por id antes de agrupar
  const uniqueSubjects = subjects.filter(
    (s, index, self) => index === self.findIndex(t => t.id === s.id)
  )
 
  // Agrupa por nome da disciplina, ordenado alfabeticamente
  const grouped = uniqueSubjects.reduce((acc, s) => {
    if (!acc[s.name]) acc[s.name] = []
    acc[s.name].push(s)
    return acc
  }, {} as Record<string, Subject[]>)
 
  // Ordena as séries dentro de cada grupo pela ordem natural
  const GRADE_ORDER = [
    'Educação Infantil',
    '1º Ano Fundamental','2º Ano Fundamental','3º Ano Fundamental',
    '4º Ano Fundamental','5º Ano Fundamental','6º Ano Fundamental',
    '7º Ano Fundamental','8º Ano Fundamental','9º Ano Fundamental',
    '1ª Série Médio','2ª Série Médio','3ª Série Médio',
  ]
 
  const sortedGroupEntries = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
    .map(([name, subs]) => ([
      name,
      subs.sort((a, b) => {
        const ia = GRADE_ORDER.indexOf(a.grade)
        const ib = GRADE_ORDER.indexOf(b.grade)
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
      }),
    ] as [string, Subject[]]))
 
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
            label="E-mail" type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            required placeholder="prof@email.com"
            icon={<Mail style={{ width: 15, height: 15 }} />}
          />
          <Input
            label="WhatsApp" value={phone}
            onChange={e => setPhone(applyPhoneMask(e.target.value))}
            required placeholder="+55 (86) 99999-9999"
            hint="Ex: +55 (86) 99999-9999"
            icon={<Phone style={{ width: 15, height: 15 }} />}
          />
        </div>
 
        {/* Disciplinas / Séries */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#3d5c42', marginBottom: 8 }}>
            Disciplinas / Séries
          </p>
          <div style={{ border: '1.5px solid rgba(97,206,112,0.2)', borderRadius: 12, overflow: 'hidden', maxHeight: 260, overflowY: 'auto' }}>
            {sortedGroupEntries.length === 0 ? (
              <p style={{ padding: '16px', color: '#6b8f72', fontSize: 13 }}>
                Nenhuma disciplina disponível.
              </p>
            ) : sortedGroupEntries.map(([groupName, subs]) => (
              <div key={groupName}>
                <div style={{ background: '#f7fdf8', padding: '8px 16px', borderBottom: '1px solid rgba(97,206,112,0.1)', position: 'sticky', top: 0 }}>
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
                    <div onClick={() => toggle(sub.id)} style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                      border: `2px solid ${selected.includes(sub.id) ? '#23A455' : '#c8d8ca'}`,
                      background: selected.includes(sub.id) ? '#23A455' : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', padding: '12px 16px', borderRadius: 10, fontSize: 13 }}>
            <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
            {error}
          </div>
        )}
 
        <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
          <Button variant="outline" onClick={onClose} type="button" style={{ flex: 1 }}>Cancelar</Button>
          <Button variant="primary" type="submit" loading={loading} style={{ flex: 1 }}>
            {teacher ? 'Salvar alterações' : 'Cadastrar professor'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
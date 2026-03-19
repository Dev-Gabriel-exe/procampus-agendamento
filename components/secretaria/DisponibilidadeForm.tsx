// components/secretaria/DisponibilidadeForm.tsx
'use client'

import { useState } from 'react'
import { AlertCircle, Clock } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { generateSlots } from '@/lib/slots'
import type { Teacher } from '@/types'

const DAYS = [
  { value: 1, label: 'Segunda-feira', short: 'Seg' },
  { value: 2, label: 'Terça-feira',   short: 'Ter' },
  { value: 3, label: 'Quarta-feira',  short: 'Qua' },
  { value: 4, label: 'Quinta-feira',  short: 'Qui' },
  { value: 5, label: 'Sexta-feira',   short: 'Sex' },
  { value: 6, label: 'Sábado',        short: 'Sáb' },
  { value: 0, label: 'Domingo',       short: 'Dom' },
]

interface DisponibilidadeFormProps {
  open: boolean
  teacher: Teacher | null
  onClose: () => void
  onSave: () => void
}

export default function DisponibilidadeForm({ open, teacher, onClose, onSave }: DisponibilidadeFormProps) {
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(null)
  const [startTime, setStartTime] = useState('')
  const [endTime,   setEndTime]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  // Preview dos slots individuais de 20min
  const preview = startTime && endTime ? generateSlots(startTime, endTime) : []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (dayOfWeek === null) { setError('Selecione o dia da semana.'); return }
    if (preview.length === 0) { setError('O intervalo precisa ter no mínimo 20 minutos.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/disponibilidade-prof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: teacher?.id, dayOfWeek, startTime, endTime }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao salvar'); return }

      // Informa quantos foram criados/pulados
      if (data.skipped?.length > 0) {
        console.log(`${data.skipped.length} slot(s) já existiam e foram ignorados.`)
      }

      setDayOfWeek(null); setStartTime(''); setEndTime('')
      onSave(); onClose()
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: 12,
    border: '1.5px solid rgba(97,206,112,0.2)', background: 'white',
    fontSize: 14, outline: 'none', fontFamily: 'inherit', color: '#0a1a0d',
    transition: 'all 0.2s',
  }

  return (
    <Modal open={open} onClose={onClose}
      title="Adicionar Disponibilidade"
      subtitle={teacher ? `Professor(a): ${teacher.name}` : ''}
      accent="linear-gradient(135deg,#4054B2,#6EC1E4)"
      maxWidth={480}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Dia da semana */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3d5c42', marginBottom: 8 }}>
            Dia da semana (recorrente)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {DAYS.map(d => (
              <button key={d.value} type="button" onClick={() => setDayOfWeek(d.value)}
                style={{
                  padding: '10px 4px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s', border: '1.5px solid', textAlign: 'center',
                  background: dayOfWeek === d.value ? 'linear-gradient(135deg,#23A455,#61CE70)' : 'white',
                  color: dayOfWeek === d.value ? 'white' : '#3d5c42',
                  borderColor: dayOfWeek === d.value ? 'transparent' : 'rgba(97,206,112,0.2)',
                  boxShadow: dayOfWeek === d.value ? '0 4px 14px rgba(97,206,112,0.35)' : 'none',
                }}>
                {d.short}
              </button>
            ))}
          </div>
          {dayOfWeek !== null && (
            <p style={{ fontSize: 12, color: '#23A455', fontWeight: 600, marginTop: 8 }}>
              ✓ Todo(a) {DAYS.find(d => d.value === dayOfWeek)?.label}
            </p>
          )}
        </div>

        {/* Horários */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3d5c42', marginBottom: 8 }}>Início</label>
            <input type="time" value={startTime} required onChange={e => setStartTime(e.target.value)} style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#23A455'; e.target.style.boxShadow = '0 0 0 4px rgba(97,206,112,0.12)' }}
              onBlur={e  => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3d5c42', marginBottom: 8 }}>Fim</label>
            <input type="time" value={endTime} required onChange={e => setEndTime(e.target.value)} style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#23A455'; e.target.style.boxShadow = '0 0 0 4px rgba(97,206,112,0.12)' }}
              onBlur={e  => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
        </div>

        {/* ✅ Preview individual dos slots */}
        {preview.length > 0 && (
          <div style={{ background: '#f7fdf8', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(97,206,112,0.15)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#3d5c42', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock style={{ width: 13, height: 13, color: '#23A455' }} />
              {preview.length} slot{preview.length !== 1 ? 's' : ''} de 20 min que serão criados:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {preview.map((slot, i) => (
                <span key={i} style={{
                  fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 999,
                  background: '#e8f9eb', color: '#23A455',
                  border: '1px solid rgba(97,206,112,0.25)',
                }}>
                  {slot.startTime} – {slot.endTime}
                </span>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#6b8f72', marginTop: 8 }}>
              Cada slot pode ser removido individualmente depois.
            </p>
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', padding: '12px 16px', borderRadius: 10, fontSize: 13 }}>
            <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="outline" type="button" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</Button>
          <Button variant="primary" type="submit" loading={loading} style={{ flex: 1, justifyContent: 'center' }}>
            Salvar {preview.length > 0 ? `${preview.length} slot(s)` : 'disponibilidade'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
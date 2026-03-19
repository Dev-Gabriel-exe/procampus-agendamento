// components/secretaria/DisponibilidadeForm.tsx
'use client'

import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import SlotPreview from '@/components/secretaria/SlotPreview'
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

export default function DisponibilidadeForm({
  open, teacher, onClose, onSave,
}: DisponibilidadeFormProps) {
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(null)
  const [startTime, setStartTime] = useState('')
  const [endTime,   setEndTime]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  // ✅ FIX: usa 20min (default do generateSlots atualizado)
  const preview = startTime && endTime ? generateSlots(startTime, endTime) : []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (dayOfWeek === null) { setError('Selecione o dia da semana.'); return }
    // ✅ FIX: validação correta para 20min
    if (preview.length === 0) { setError('O intervalo precisa ter no mínimo 20 minutos.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/disponibilidade-prof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: teacher?.id, dayOfWeek, startTime, endTime }),
      })
      if (!res.ok) {
        setError((await res.json()).error || 'Erro ao salvar')
        return
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

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 600,
    color: '#3d5c42', marginBottom: 8,
  }

  return (
    <Modal
      open={open} onClose={onClose}
      title="Adicionar Disponibilidade"
      subtitle={teacher ? `Professor(a): ${teacher.name}` : ''}
      accent="linear-gradient(135deg,#4054B2,#6EC1E4)"
      maxWidth={480}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Dia da semana */}
        <div>
          <label style={labelStyle}>Dia da semana (recorrente)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {DAYS.map(d => (
              <button
                key={d.value} type="button"
                onClick={() => setDayOfWeek(d.value)}
                style={{
                  padding: '10px 4px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s', border: '1.5px solid',
                  textAlign: 'center',
                  background: dayOfWeek === d.value ? 'linear-gradient(135deg,#23A455,#61CE70)' : 'white',
                  color: dayOfWeek === d.value ? 'white' : '#3d5c42',
                  borderColor: dayOfWeek === d.value ? 'transparent' : 'rgba(97,206,112,0.2)',
                  boxShadow: dayOfWeek === d.value ? '0 4px 14px rgba(97,206,112,0.35)' : 'none',
                }}
              >
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
            <label style={labelStyle}>Início</label>
            <input type="time" value={startTime} required
              onChange={e => setStartTime(e.target.value)} style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#23A455'; e.target.style.boxShadow = '0 0 0 4px rgba(97,206,112,0.12)' }}
              onBlur={e  => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Fim</label>
            <input type="time" value={endTime} required
              onChange={e => setEndTime(e.target.value)} style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#23A455'; e.target.style.boxShadow = '0 0 0 4px rgba(97,206,112,0.12)' }}
              onBlur={e  => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
        </div>

        {/* Preview dos slots — mostra quantos slots de 20min serão gerados */}
        {preview.length > 0 && (
          <div style={{ background: '#f7fdf8', borderRadius: 12, padding: '12px 16px', border: '1px solid rgba(97,206,112,0.15)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#3d5c42', marginBottom: 8 }}>
              {preview.length} slot(s) de 20 minutos:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {preview.map((slot, i) => (
                <span key={i} style={{
                  fontSize: 12, fontWeight: 600, padding: '4px 10px',
                  borderRadius: 999, background: '#e8f9eb', color: '#23A455',
                  border: '1px solid rgba(97,206,112,0.25)',
                }}>
                  {slot.startTime} – {slot.endTime}
                </span>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', padding: '12px 16px', borderRadius: 10, fontSize: 13 }}>
            <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="outline" type="button" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" loading={loading} style={{ flex: 1, justifyContent: 'center' }}>
            Salvar disponibilidade
          </Button>
        </div>
      </form>
    </Modal>
  )
}
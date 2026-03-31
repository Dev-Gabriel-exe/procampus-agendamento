// components/secretaria/HorarioEspecialForm.tsx
'use client'

import { useState } from 'react'
import { AlertCircle, Clock, CalendarDays } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { generateSlots } from '@/lib/slots'
import type { Teacher } from '@/types'

interface HorarioEspecialFormProps {
  open: boolean
  teacher: Teacher | null
  onClose: () => void
  onSave: () => void
}

export default function HorarioEspecialForm({ open, teacher, onClose, onSave }: HorarioEspecialFormProps) {
  const [specificDate, setSpecificDate] = useState('')
  const [startTime,    setStartTime]    = useState('')
  const [endTime,      setEndTime]      = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  // Data mínima = hoje
  const today = new Date().toISOString().split('T')[0]

  // Preview dos slots de 20min
  const preview = startTime && endTime ? generateSlots(startTime, endTime) : []

  function handleClose() {
    setSpecificDate(''); setStartTime(''); setEndTime(''); setError('')
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!specificDate) { setError('Selecione a data.'); return }
    if (preview.length === 0) { setError('O intervalo precisa ter no mínimo 20 minutos.'); return }
    if (startTime >= endTime) { setError('O horário de fim deve ser após o início.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/disponibilidade-prof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId:    teacher?.id,
          specificDate,           // "YYYY-MM-DD"
          startTime,
          endTime,
          isSpecial:    true,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao salvar'); return }

      if (data.skipped?.length > 0) {
        console.log(`${data.skipped.length} slot(s) já existiam e foram ignorados.`)
      }

      handleClose()
      onSave()
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
    display: 'block', fontSize: 13, fontWeight: 600, color: '#3d5c42', marginBottom: 8,
  }

  // Formata a data selecionada em pt-BR para exibir no preview
  const dateFormatted = specificDate
    ? new Date(`${specificDate}T12:00:00`).toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      })
    : null

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Horário Especial"
      subtitle={teacher ? `Professor(a): ${teacher.name}` : ''}
      accent="linear-gradient(135deg,#7c3aed,#a78bfa)"
      maxWidth={480}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Aviso */}
        <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10 }}>
          <CalendarDays style={{ width: 16, height: 16, color: '#7c3aed', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: '#5b21b6', margin: 0, lineHeight: 1.5 }}>
            Horários especiais são <strong>válidos uma única vez</strong> na data escolhida. Cada bloco gera slots de 20 min.
          </p>
        </div>

        {/* Data específica */}
        <div>
          <label style={labelStyle}>Data do plantão especial</label>
          <input
            type="date"
            value={specificDate}
            min={today}
            required
            onChange={e => setSpecificDate(e.target.value)}
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 4px rgba(124,58,237,0.1)' }}
            onBlur={e  => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.boxShadow = 'none' }}
          />
          {dateFormatted && (
            <p style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600, marginTop: 6, textTransform: 'capitalize' }}>
              📅 {dateFormatted}
            </p>
          )}
        </div>

        {/* Horários */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={labelStyle}>Início</label>
            <input
              type="time" value={startTime} required
              onChange={e => setStartTime(e.target.value)}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 4px rgba(124,58,237,0.1)' }}
              onBlur={e  => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Fim</label>
            <input
              type="time" value={endTime} required
              onChange={e => setEndTime(e.target.value)}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 4px rgba(124,58,237,0.1)' }}
              onBlur={e  => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
        </div>

        {/* Preview de slots */}
        {preview.length > 0 && (
          <div style={{ background: '#f5f3ff', borderRadius: 12, padding: '14px 16px', border: '1px solid #ddd6fe' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#5b21b6', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock style={{ width: 13, height: 13, color: '#7c3aed' }} />
              {preview.length} slot{preview.length !== 1 ? 's' : ''} de 20 min que serão criados:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {preview.map((slot, i) => (
                <span key={i} style={{
                  fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 999,
                  background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd',
                }}>
                  {slot.startTime} – {slot.endTime}
                </span>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#7c3aed', marginTop: 8, opacity: 0.7 }}>
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
          <Button variant="outline" type="button" onClick={handleClose} style={{ flex: 1, justifyContent: 'center' }}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            loading={loading}
            style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}
          >
            Salvar {preview.length > 0 ? `${preview.length} slot(s)` : ''}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
// ============================================================
// ARQUIVO: src/components/agendamento/Step2Horarios.tsx
// ============================================================

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, CalendarDays, User, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react'
import  Button  from '@/components/ui/Button'
import  LoadingSpinner  from '@/components/ui/LoadingSpinner'

interface Slot {
  slotId: string
  teacherName: string
  date: string        // ISO string
  startTime: string   // "HH:MM"
  endTime: string
  dateLabel: string   // "Segunda, 23 jan"
}

interface Step2Props {
  subjectId: string
  grade: string
  onNext: (data: { slotId: string; teacherName: string; date: string; startTime: string; endTime: string; dateLabel: string }) => void
  onBack: () => void
}

// Agrupa slots por data
function groupByDate(slots: Slot[]) {
  return slots.reduce((acc, s) => {
    if (!acc[s.dateLabel]) acc[s.dateLabel] = []
    acc[s.dateLabel].push(s)
    return acc
  }, {} as Record<string, Slot[]>)
}

const DAYS_PT: Record<string, string> = {
  Monday: 'Segunda', Tuesday: 'Terça', Wednesday: 'Quarta',
  Thursday: 'Quinta', Friday: 'Sexta', Saturday: 'Sábado',
}

function formatDateLabel(isoString: string): string {
  const d = new Date(isoString)
  const dayName = d.toLocaleDateString('en-US', { weekday: 'long' })
  const day = d.getDate().toString().padStart(2, '0')
  const month = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  return `${DAYS_PT[dayName] || dayName}, ${day} ${month}`
}

export function Step2Horarios({ subjectId, grade, onNext, onBack }: Step2Props) {
  const [slots, setSlots]     = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [selected, setSelected] = useState<Slot | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/disponibilidade?subjectId=${subjectId}&grade=${encodeURIComponent(grade)}`)
      .then((r) => r.json())
      .then((data: Slot[]) => {
        const labeled = data.map((s) => ({ ...s, dateLabel: formatDateLabel(s.date) }))
        setSlots(labeled)
        setLoading(false)
      })
      .catch(() => { setError('Não foi possível carregar os horários.'); setLoading(false) })
  }, [subjectId, grade])

  const grouped = groupByDate(slots)
  const dateKeys = Object.keys(grouped)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <LoadingSpinner size={32} />
        <p className="text-text-soft text-sm">Buscando horários disponíveis...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-red-500 text-sm">{error}</p>
        <Button variant="outline" onClick={onBack}>Voltar</Button>
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 gap-4 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
          <CalendarDays className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="font-semibold text-gray-700 text-lg">Nenhum horário disponível</h3>
        <p className="text-text-soft text-sm max-w-xs">
          Não há horários livres para esta disciplina no momento. Tente outra disciplina ou volte mais tarde.
        </p>
        <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />} onClick={onBack}>
          Escolher outra disciplina
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Título */}
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#4054B2,#6EC1E4)' }}>
          <Clock className="w-7 h-7 text-white" />
        </div>
        <h2 className="font-display font-bold text-2xl text-gray-800">Escolha o horário</h2>
        <p className="text-text-soft text-sm mt-2">
          {slots.length} horário{slots.length !== 1 ? 's' : ''} disponível{slots.length !== 1 ? 'is' : ''}
        </p>
      </div>

      {/* Grid por dia */}
      <div className="space-y-6">
        {dateKeys.map((dateLabel, di) => (
          <motion.div
            key={dateLabel}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: di * 0.08 }}
          >
            {/* Cabeçalho do dia */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-brand" />
              <h3 className="text-sm font-bold text-gray-700">{dateLabel}</h3>
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-text-soft">
                {grouped[dateLabel].length} vaga{grouped[dateLabel].length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Cards de horário */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {grouped[dateLabel].map((slot, i) => {
                const isSelected = selected?.slotId === slot.slotId
                return (
                  <motion.button
                    key={slot.slotId}
                    type="button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: di * 0.08 + i * 0.04 }}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelected(slot)}
                    className={[
                      'relative px-4 py-4 rounded-xl border-2 text-left',
                      'transition-all duration-200 cursor-pointer overflow-hidden',
                      isSelected
                        ? 'border-brand-dark shadow-brand'
                        : 'border-gray-200 bg-white hover:border-brand/50',
                    ].join(' ')}
                    style={isSelected ? { background: 'linear-gradient(135deg,#f0faf2,#e8f9eb)' } : {}}
                  >
                    {/* Faixa colorida no topo */}
                    {isSelected && (
                      <motion.div
                        layoutId="slot-selected"
                        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                        style={{ background: 'linear-gradient(90deg,#23A455,#61CE70)' }}
                      />
                    )}

                    <div className="flex items-center gap-2 mb-2">
                      <Clock className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-brand-dark' : 'text-gray-400'}`} />
                      <span className={`font-bold text-sm ${isSelected ? 'text-brand-dark' : 'text-gray-800'}`}>
                        {slot.startTime}
                      </span>
                      <span className="text-gray-400 text-xs">– {slot.endTime}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <User className={`w-3 h-3 flex-shrink-0 ${isSelected ? 'text-brand' : 'text-gray-400'}`} />
                      <span className={`text-xs font-medium truncate ${isSelected ? 'text-brand-dark' : 'text-text-soft'}`}>
                        {slot.teacherName}
                      </span>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Resumo do selecionado */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="rounded-xl p-4 border border-brand/30"
            style={{ background: 'linear-gradient(135deg,#f0faf2,#e8f9eb)' }}
          >
            <p className="text-xs font-bold text-brand-dark mb-1 uppercase tracking-wide">Horário selecionado</p>
            <p className="text-gray-800 font-semibold text-sm">
              {selected.dateLabel} às {selected.startTime} — Prof. {selected.teacherName}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navegação */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={onBack}
          className="flex-none"
        >
          Voltar
        </Button>
        <Button
          className="w-full"
          size="lg"
          disabled={!selected}
          iconRight={<ArrowRight className="w-5 h-5" />}
          onClick={() => selected && onNext(selected)}
        >
          Continuar
        </Button>
      </div>
    </motion.div>
  )
}
// ============================================================
// ARQUIVO: src/components/agendamento/Step1SerieMateria.tsx
// ============================================================

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, BookOpen, ArrowRight, ChevronDown } from 'lucide-react'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface Subject {
  id: string
  name: string
  grade: string
}

interface Step1Props {
  onNext: (data: { subjectId: string; subjectName: string; grade: string }) => void
}

// Agrupa disciplinas por série
function groupByGrade(subjects: Subject[]) {
  return subjects.reduce((acc, s) => {
    if (!acc[s.grade]) acc[s.grade] = []
    acc[s.grade].push(s)
    return acc
  }, {} as Record<string, Subject[]>)
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}
const itemVariants = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

export function Step1SerieMateria({ onNext }: Step1Props) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGrade, setSelectedGrade] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [gradeOpen, setGradeOpen] = useState(false)

  useEffect(() => {
    fetch('/api/disciplinas')
      .then((r) => r.json())
      .then((data) => { setSubjects(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const grouped = groupByGrade(subjects)
  const grades  = Object.keys(grouped).sort()
  const subjectsForGrade = selectedGrade ? grouped[selectedGrade] || [] : []

  function handleNext() {
    if (!selectedSubject) return
    onNext({
      subjectId:   selectedSubject.id,
      subjectName: selectedSubject.name,
      grade:       selectedSubject.grade,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="32" />
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Título da etapa */}
      <motion.div variants={itemVariants} className="text-center">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#23A455,#61CE70)' }}>
          <GraduationCap className="w-7 h-7 text-white" />
        </div>
        <h2 className="font-display font-bold text-2xl text-gray-800">
          Qual a série do seu filho?
        </h2>
        <p className="text-text-soft text-sm mt-2">
          Selecione a série e depois a disciplina para ver os professores disponíveis.
        </p>
      </motion.div>

      {/* Seleção de série */}
      <motion.div variants={itemVariants}>
        <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-brand-dark" />
          Série / Ano
        </label>

        {/* Dropdown custom */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setGradeOpen(!gradeOpen)}
            className={[
              'w-full px-4 py-3.5 rounded-xl border-2 text-left flex items-center justify-between',
              'text-sm font-medium transition-all duration-200 bg-white',
              selectedGrade
                ? 'border-brand-dark text-gray-800'
                : 'border-gray-200 text-gray-400',
              gradeOpen ? 'border-brand-dark shadow-[0_0_0_4px_rgba(97,206,112,0.12)]' : '',
            ].join(' ')}
          >
            <span>{selectedGrade || 'Selecione a série...'}</span>
            <motion.div animate={{ rotate: gradeOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </motion.div>
          </button>

          {gradeOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl z-20 overflow-hidden"
            >
              {grades.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => {
                    setSelectedGrade(grade)
                    setSelectedSubject(null)
                    setGradeOpen(false)
                  }}
                  className={[
                    'w-full px-4 py-3 text-left text-sm font-medium hover:bg-brand-soft',
                    'border-b border-gray-50 last:border-0 transition-colors',
                    selectedGrade === grade ? 'bg-brand-soft text-brand-dark' : 'text-gray-700',
                  ].join(' ')}
                >
                  {grade}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Seleção de disciplina */}
      {selectedGrade && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-dark" />
            Disciplina
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {subjectsForGrade.map((sub, i) => {
              const isSelected = selectedSubject?.id === sub.id
              return (
                <motion.button
                  key={sub.id}
                  type="button"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedSubject(sub)}
                  className={[
                    'relative px-4 py-4 rounded-xl border-2 text-sm font-semibold text-center',
                    'transition-all duration-200 cursor-pointer',
                    isSelected
                      ? 'border-brand-dark bg-brand-soft text-brand-dark shadow-brand'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-brand/50 hover:bg-brand-soft/50',
                  ].join(' ')}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="subject-selected"
                      className="absolute inset-0 rounded-xl bg-brand-soft border-2 border-brand-dark"
                      style={{ zIndex: -1 }}
                    />
                  )}
                  <BookOpen className={`w-5 h-5 mx-auto mb-2 ${isSelected ? 'text-brand-dark' : 'text-gray-400'}`} />
                  {sub.name}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Botão avançar */}
      <motion.div variants={itemVariants}>
        <Button
          fullWidth
          size="lg"
          disabled={!selectedSubject}
          onClick={handleNext}
          iconRight={<ArrowRight className="w-5 h-5" />}
        >
          Continuar
        </Button>
      </motion.div>
    </motion.div>
  )
}
// ============================================================
// ARQUIVO: src/components/agendamento/Step4Confirmacao.tsx
// ============================================================

'use client'

import { motion } from 'framer-motion'
import { CheckCircle, CalendarDays, MessageCircle, User, Clock, BookOpen, GraduationCap, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Button  from '@/components/ui/Button'

interface ConfirmacaoData {
  parentName:   string
  studentName:  string
  studentGrade: string
  subjectName:  string
  teacherName:  string
  dateLabel:    string
  startTime:    string
  endTime:      string
  calendarLink: string
  whatsappLink: string
}

interface Step4Props {
  data: ConfirmacaoData
}

const ITEM_DELAY = 0.08

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: ITEM_DELAY } },
}
const itemVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
}

export function Step4Confirmacao({ data }: Step4Props) {
  const details = [
    { icon: <User className="w-4 h-4" />,          label: 'Responsável',  value: data.parentName   },
    { icon: <GraduationCap className="w-4 h-4" />, label: 'Aluno',        value: data.studentName  },
    { icon: <BookOpen className="w-4 h-4" />,      label: 'Disciplina',   value: `${data.subjectName} — ${data.studentGrade}` },
    { icon: <User className="w-4 h-4" />,          label: 'Professor(a)', value: data.teacherName  },
    { icon: <CalendarDays className="w-4 h-4" />,  label: 'Data',         value: data.dateLabel    },
    { icon: <Clock className="w-4 h-4" />,         label: 'Horário',      value: `${data.startTime} – ${data.endTime} (30 min)` },
  ]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Ícone de sucesso */}
      <motion.div
        variants={itemVariants}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
          className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center shadow-brand-lg"
          style={{ background: 'linear-gradient(135deg,#23A455,#61CE70)' }}
        >
          <CheckCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
        </motion.div>

        <motion.h2
          variants={itemVariants}
          className="font-display font-black text-3xl text-gray-800"
        >
          Agendado! 🎉
        </motion.h2>
        <motion.p
          variants={itemVariants}
          className="text-text-soft text-sm mt-2 max-w-sm mx-auto"
        >
          Sua reunião foi confirmada. Você receberá um e-mail de confirmação em breve.
        </motion.p>
      </motion.div>

      {/* Card de resumo */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl overflow-hidden border border-brand/20 shadow-card"
      >
        {/* Header do card */}
        <div
          className="px-5 py-4"
          style={{ background: 'linear-gradient(135deg,#1a7a2e,#23A455)' }}
        >
          <p className="text-white/80 text-xs font-bold uppercase tracking-wider">
            Resumo do agendamento
          </p>
        </div>

        {/* Detalhes */}
        <div className="bg-white divide-y divide-gray-50">
          {details.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.07 }}
              className="flex items-start gap-3 px-5 py-3.5"
            >
              <span className="text-brand mt-0.5 flex-shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-soft">{item.label}</p>
                <p className="text-gray-800 font-semibold text-sm truncate">{item.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Ações */}
      <motion.div variants={itemVariants} className="space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
          Adicione à sua agenda
        </p>

        <a href={data.calendarLink} target="_blank" rel="noopener noreferrer" className="block">
          <Button
            className="w-full"
            size="lg"
            variant="outline"
            icon={<CalendarDays className="w-5 h-5" />}
            iconRight={<ArrowRight className="w-4 h-4 opacity-60" />}
          >
            Adicionar ao Google Calendar
          </Button>
        </a>

        {data.whatsappLink && (
          <div
            className="rounded-xl p-4 border border-green-200"
            style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}
          >
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Confirme via WhatsApp</p>
                <p className="text-xs text-emerald-700 mt-1">
                  A secretaria entrará em contato para confirmar o horário com o professor.
                  Fique atento ao seu WhatsApp: <strong>{/* parentPhone passado por prop */}</strong>
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Novo agendamento */}
      <motion.div variants={itemVariants} className="text-center">
        <Link href="/agendamento">
          <button className="text-sm text-brand-dark font-semibold hover:underline transition-all">
            Fazer outro agendamento →
          </button>
        </Link>
      </motion.div>
    </motion.div>
  )
}
// ============================================================
// ARQUIVO: src/components/agendamento/Step3Formulario.tsx
// ============================================================

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, BookOpen, MessageSquare, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface FormData {
  parentName:   string
  parentEmail:  string
  parentPhone:  string
  studentName:  string
  reason:       string
}

interface Step3Props {
  onNext: (data: FormData) => void
  onBack: () => void
  loading?: boolean
  error?: string
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}
const itemVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
}

const REASONS = [
  'Desempenho escolar',
  'Comportamento em sala',
  'Dificuldade em aprendizado',
  'Acompanhamento de notas',
  'Outro',
]

export function Step3Formulario({ onNext, onBack, loading = false, error = '' }: Step3Props) {
  const [form, setForm] = useState<FormData>({
    parentName:  '',
    parentEmail: '',
    parentPhone: '',
    studentName: '',
    reason:      '',
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  function validate(): boolean {
    const newErrors: Partial<FormData> = {}
    if (!form.parentName.trim())  newErrors.parentName  = 'Informe seu nome'
    if (!form.parentEmail.trim()) newErrors.parentEmail = 'Informe seu e-mail'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.parentEmail))
                                  newErrors.parentEmail = 'E-mail inválido'
    if (!form.parentPhone.trim()) newErrors.parentPhone = 'Informe seu telefone'
    if (!form.studentName.trim()) newErrors.studentName = 'Informe o nome do aluno'
    if (!form.reason.trim())      newErrors.reason      = 'Informe o motivo'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) onNext(form)
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Título */}
      <motion.div variants={itemVariants} className="text-center">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#23A455,#61CE70)' }}>
          <User className="w-7 h-7 text-white" />
        </div>
        <h2 className="font-display font-bold text-2xl text-gray-800">
          Seus dados
        </h2>
        <p className="text-text-soft text-sm mt-2">
          Preencha as informações abaixo para confirmarmos o agendamento.
        </p>
      </motion.div>

      {/* Bloco responsável */}
      <motion.div variants={itemVariants} className="space-y-4">
        <p className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-brand-soft border border-brand/30 flex items-center justify-center text-[10px]">1</span>
          Responsável
        </p>

        <Input
          label="Nome completo"
          placeholder="Ex: Maria da Silva"
          value={form.parentName}
          onChange={(e) => set('parentName', e.target.value)}
          error={errors.parentName}
          icon={<User className="w-4 h-4" />}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="E-mail"
            type="email"
            placeholder="maria@email.com"
            value={form.parentEmail}
            onChange={(e) => set('parentEmail', e.target.value)}
            error={errors.parentEmail}
            icon={<Mail className="w-4 h-4" />}
            required
          />
          <Input
            label="WhatsApp / Telefone"
            placeholder="(86) 99999-9999"
            value={form.parentPhone}
            onChange={(e) => set('parentPhone', e.target.value)}
            error={errors.parentPhone}
            icon={<Phone className="w-4 h-4" />}
            required
          />
        </div>
      </motion.div>

      {/* Divisor */}
      <motion.div variants={itemVariants} className="divider-shine" />

      {/* Bloco aluno */}
      <motion.div variants={itemVariants} className="space-y-4">
        <p className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-brand-soft border border-brand/30 flex items-center justify-center text-[10px]">2</span>
          Aluno
        </p>

        <Input
          label="Nome do aluno"
          placeholder="Ex: João Silva"
          value={form.studentName}
          onChange={(e) => set('studentName', e.target.value)}
          error={errors.studentName}
          icon={<BookOpen className="w-4 h-4" />}
          required
        />
      </motion.div>

      {/* Divisor */}
      <motion.div variants={itemVariants} className="divider-shine" />

      {/* Motivo */}
      <motion.div variants={itemVariants} className="space-y-3">
        <p className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-brand-soft border border-brand/30 flex items-center justify-center text-[10px]">3</span>
          Motivo da reunião
        </p>

        {/* Pills de motivo rápido */}
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => set('reason', r)}
              className={[
                'text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-200',
                form.reason === r
                  ? 'border-brand-dark bg-brand-soft text-brand-dark'
                  : 'border-gray-200 text-gray-500 hover:border-brand/50',
              ].join(' ')}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Textarea livre */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-dark" />
            Descreva o motivo
          </label>
          <textarea
            rows={3}
            placeholder="Explique brevemente o motivo da reunião..."
            value={form.reason}
            onChange={(e) => set('reason', e.target.value)}
            className={[
              'input-premium resize-none',
              errors.reason ? 'border-red-400 focus:!border-red-500' : '',
            ].join(' ')}
          />
          {errors.reason && (
            <p className="text-red-500 text-xs font-medium">{errors.reason}</p>
          )}
        </div>
      </motion.div>

      {/* Erro da API */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Navegação */}
      <motion.div variants={itemVariants} className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={onBack}
          className="flex-none"
        >
          Voltar
        </Button>
        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          iconRight={<ArrowRight className="w-5 h-5" />}
        >
          Confirmar agendamento
        </Button>
      </motion.div>
    </motion.form>
  )
}
'use client'

import { motion } from 'framer-motion'
import {
  CalendarDays, Phone, Mail, MessageCircle,
  XCircle, GraduationCap, Clock
} from 'lucide-react'
import { generateWhatsAppLink } from '@/lib/whatsapp-link'
import { formatDateShort } from '@/lib/slots'
import Badge from '@/components/ui/Badge'

type AppointmentFull = {
  id: string
  date: Date | string
  startTime: string
  endTime: string
  parentName: string
  parentEmail: string
  parentPhone: string
  reason: string
  studentName: string
  studentGrade: string
  status: string
  availability: {
    dayOfWeek: number
    startTime: string
    endTime: string
    teacher: { name: string; phone: string; email: string }
  }
}

export default function AgendamentoCard({
  appt, onCancel, index = 0,
}: {
  appt: AppointmentFull
  onCancel: (id: string) => void
  index?: number
}) {
  const teacher     = appt.availability.teacher
  const date        = formatDateShort(appt.date)
  const isCancelled = appt.status === 'cancelled'

  const waLink = generateWhatsAppLink({
    phone:       teacher.phone,
    teacherName: teacher.name,
    parentName:  appt.parentName,
    studentName: appt.studentName,
    date,
    startTime:   appt.startTime,
    subject: (appt as any).subjectName || appt.studentGrade,
    grade:       appt.studentGrade,
    reason:      appt.reason,
  })

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      className="print-card"
      style={{
        background: 'white',
        borderRadius: 20,
        border: isCancelled
          ? '1.5px solid #fecaca'
          : '1.5px solid rgba(97,206,112,0.15)',
        overflow: 'hidden',
        opacity: isCancelled ? 0.65 : 1,
        boxShadow: isCancelled ? 'none' : '0 2px 20px rgba(0,0,0,0.04)',
        transition: 'all 0.3s',
      }}
      whileHover={!isCancelled ? { y: -4, boxShadow: '0 16px 48px rgba(97,206,112,0.12)' } : {}}
    >
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        background: isCancelled
          ? '#fff5f5'
          : 'linear-gradient(135deg,#1a7a2e,#23A455)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarDays style={{
            width: 15, height: 15,
            color: isCancelled ? '#f87171' : 'rgba(255,255,255,0.8)',
          }} />
          <span style={{
            fontSize: 13, fontWeight: 600,
            color: isCancelled ? '#dc2626' : 'white',
          }}>
            {date} às {appt.startTime}
          </span>
        </div>
        <Badge variant={isCancelled ? 'red' : 'white'}
          icon={<Clock style={{ width: 10, height: 10 }} />}>
          {isCancelled ? 'Cancelado' : '30 min'}
        </Badge>
      </div>

      {/* Corpo */}
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Professor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg,#e8f9eb,#c3e6cb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GraduationCap style={{ width: 18, height: 18, color: '#23A455' }} />
          </div>
          <div>
            <p style={{ fontSize: 11, color: '#6b8f72', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Professor(a)
            </p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0a1a0d', marginTop: 1 }}>
              {teacher.name}
            </p>
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(97,206,112,0.1)' }} />

        {/* Responsável e aluno */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, color: '#6b8f72', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
              Responsável
            </p>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0a1a0d' }}>{appt.parentName}</p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: '#6b8f72', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
              Aluno / Série
            </p>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0a1a0d' }}>{appt.studentName}</p>
            <p style={{ fontSize: 11, color: '#6b8f72', marginTop: 1 }}>{appt.studentGrade}</p>
          </div>
        </div>

        {/* Motivo */}
        <div style={{
          background: '#f7fdf8', borderRadius: 12, padding: '12px 14px',
          border: '1px solid rgba(97,206,112,0.1)',
        }}>
          <p style={{ fontSize: 11, color: '#6b8f72', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Motivo
          </p>
          <p style={{ fontSize: 13, color: '#3d5c42', lineHeight: 1.5 }}>{appt.reason}</p>
        </div>

        {/* Contato */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b8f72' }}>
            <Phone style={{ width: 12, height: 12 }} />{appt.parentPhone}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b8f72', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <Mail style={{ width: 12, height: 12 }} />{appt.parentEmail}
          </span>
        </div>

        {/* Ações */}
        {!isCancelled && (
          <div style={{ display: 'flex', gap: 8 }} className="no-print">
            <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ flex: 1 }}>
              <button style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 6,
                background: '#25D366', color: 'white', border: 'none',
                borderRadius: 12, padding: '10px 0',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1ab554')}
                onMouseLeave={e => (e.currentTarget.style.background = '#25D366')}
              >
                <MessageCircle style={{ width: 14, height: 14 }} />
                WhatsApp Prof.
              </button>
            </a>
            <button onClick={() => onCancel(appt.id)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              background: '#fef2f2', color: '#dc2626',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 12, padding: '10px 14px',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s', flexShrink: 0,
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fef2f2')}
            >
              <XCircle style={{ width: 14, height: 14 }} />
              Cancelar
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

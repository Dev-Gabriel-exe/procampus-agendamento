// component/secretaria/AgendamentoCard.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays, Phone, Mail, MessageCircle,
  XCircle, GraduationCap, Clock, Trash2, AlertTriangle
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

// ── Modal de confirmação de exclusão ────────────────────
function DeleteModal({
  open, onConfirm, onCancel, name,
}: { open: boolean; onConfirm: () => void; onCancel: () => void; name: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 24, padding: 32,
              maxWidth: 400, width: '100%',
              boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
            }}
          >
            {/* Ícone */}
            <div style={{
              width: 56, height: 56, borderRadius: 18,
              background: '#fef2f2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Trash2 style={{ width: 26, height: 26, color: '#ef4444' }} />
            </div>

            <h3 style={{
              fontFamily: '"Roboto Slab", Georgia, serif',
              fontWeight: 800, fontSize: 20, color: '#0a1a0d',
              textAlign: 'center', marginBottom: 10,
            }}>
              Apagar agendamento?
            </h3>

            <p style={{
              fontSize: 14, color: '#6b8f72', textAlign: 'center',
              lineHeight: 1.6, marginBottom: 8,
            }}>
              Você está prestes a apagar o agendamento de{' '}
              <strong style={{ color: '#3d5c42' }}>{name}</strong>.
            </p>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#fff7ed', border: '1px solid #fed7aa',
              borderRadius: 10, padding: '10px 14px', marginBottom: 24,
            }}>
              <AlertTriangle style={{ width: 14, height: 14, color: '#c2410c', flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: '#92400e' }}>
                Esta ação é permanente e não pode ser desfeita.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onCancel}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  border: '1.5px solid rgba(97,206,112,0.2)',
                  background: 'white', color: '#3d5c42',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f7fdf8'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                  color: 'white',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(239,68,68,0.35)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Sim, apagar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function AgendamentoCard({
  appt, onCancel, onDelete, index = 0,
}: {
  appt: AppointmentFull
  onCancel: (id: string) => void
  onDelete?: (id: string) => void
  index?: number
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const teacher     = appt.availability.teacher
  const date        = formatDateShort(appt.date)
  const isCancelled = appt.status === 'cancelled'
  const isPast      = new Date(appt.date) < new Date() && !isCancelled

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

  const canDelete = isCancelled || isPast

  function handleConfirmDelete() {
    setShowDeleteModal(false)
    onDelete?.(appt.id)
  }

  return (
    <>
      <DeleteModal
        open={showDeleteModal}
        name={appt.parentName}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

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
            : isPast
            ? '1.5px solid rgba(0,0,0,0.08)'
            : '1.5px solid rgba(97,206,112,0.15)',
          overflow: 'hidden',
          opacity: (isCancelled || isPast) ? 0.65 : 1,
          boxShadow: (isCancelled || isPast) ? 'none' : '0 2px 20px rgba(0,0,0,0.04)',
          transition: 'all 0.3s',
        }}
        whileHover={!isCancelled && !isPast ? { y: -4, boxShadow: '0 16px 48px rgba(97,206,112,0.12)' } : {}}
      >
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          background: isCancelled
            ? '#fff5f5'
            : isPast
            ? '#f9fafb'
            : 'linear-gradient(135deg,#1a7a2e,#23A455)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarDays style={{
              width: 15, height: 15,
              color: isCancelled ? '#f87171' : isPast ? '#9ca3af' : 'rgba(255,255,255,0.8)',
            }} />
            <span style={{
              fontSize: 13, fontWeight: 600,
              color: isCancelled ? '#dc2626' : isPast ? '#6b7280' : 'white',
            }}>
              {date} às {appt.startTime}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge
              variant={isCancelled ? 'red' : isPast ? 'gray' : 'white'}
              icon={<Clock style={{ width: 10, height: 10 }} />}
            >
              {isCancelled ? 'Cancelado' : isPast ? 'Realizado' : '20 min'}
            </Badge>

            {/* Botão apagar — só para cancelados e passados */}
            {canDelete && onDelete && (
              <button
                onClick={() => setShowDeleteModal(true)}
                title="Apagar agendamento"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 28, borderRadius: 8,
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#ef4444', cursor: 'pointer',
                  transition: 'all 0.2s', flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444' }}
              >
                <Trash2 style={{ width: 13, height: 13 }} />
              </button>
            )}
          </div>
        </div>

        {/* Corpo */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, color: '#6b8f72', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Responsável</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0a1a0d' }}>{appt.parentName}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#6b8f72', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Aluno / Série</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0a1a0d' }}>{appt.studentName}</p>
              <p style={{ fontSize: 11, color: '#6b8f72', marginTop: 1 }}>{appt.studentGrade}</p>
            </div>
          </div>

          <div style={{ background: '#f7fdf8', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(97,206,112,0.1)' }}>
            <p style={{ fontSize: 11, color: '#6b8f72', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Motivo</p>
            <p style={{ fontSize: 13, color: '#3d5c42', lineHeight: 1.5 }}>{appt.reason}</p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b8f72' }}>
              <Phone style={{ width: 12, height: 12 }} />{appt.parentPhone}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b8f72', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Mail style={{ width: 12, height: 12 }} />{appt.parentEmail}
            </span>
          </div>

          {!isCancelled && !isPast && (
            <div style={{ display: 'flex', gap: 8 }} className="no-print">
              <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ flex: 1 }}>
                <button style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 6,
                  background: '#25D366', color: 'white', border: 'none',
                  borderRadius: 12, padding: '10px 0',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1ab554'}
                  onMouseLeave={e => e.currentTarget.style.background = '#25D366'}
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
                onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
              >
                <XCircle style={{ width: 14, height: 14 }} />
                Cancelar
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}
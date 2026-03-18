'use client'
import { MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { generateWhatsAppLink } from '@/lib/whatsapp-link'

interface WhatsAppButtonProps {
  phone: string
  teacherName: string
  parentName: string
  studentName: string
  date: string
  startTime: string
  subject: string
  grade: string
  reason: string
  size?: 'sm' | 'md'
}

export default function WhatsAppButton({
  size = 'md', ...linkProps
}: WhatsAppButtonProps) {
  const url = generateWhatsAppLink(linkProps)

  return (
    <motion.a
      href={url} target="_blank" rel="noopener noreferrer"
      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: '#25D366', color: 'white',
        borderRadius: size === 'sm' ? 8 : 10,
        padding: size === 'sm' ? '6px 12px' : '9px 16px',
        fontSize: size === 'sm' ? 12 : 13,
        fontWeight: 700, textDecoration: 'none',
        boxShadow: '0 2px 12px rgba(37,211,102,0.3)',
        transition: 'all 0.2s',
      }}
    >
      <MessageCircle style={{ width: size === 'sm' ? 13 : 15, height: size === 'sm' ? 13 : 15 }} />
      WhatsApp Prof.
    </motion.a>
  )
}

'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  accent?: string
  maxWidth?: number
}

export default function Modal({
  open, onClose, title, subtitle, children,
  accent = 'linear-gradient(135deg,#1a7a2e,#23A455)',
  maxWidth = 520,
}: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(7,20,16,0.75)', backdropFilter: 'blur(6px)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'relative', width: '100%', maxWidth,
              background: 'white', borderRadius: 24,
              boxShadow: '0 32px 100px rgba(0,0,0,0.35)',
              overflow: 'hidden', maxHeight: '92vh', display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{ background: accent, padding: '24px 28px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{
                    fontFamily: 'var(--font-display),"Roboto Slab",serif',
                    fontWeight: 700, color: 'white', fontSize: 20, lineHeight: 1.2,
                  }}>
                    {title}
                  </h2>
                  {subtitle && (
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 4 }}>
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  style={{
                    background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
                    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'white', flexShrink: 0, marginLeft: 12,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                >
                  <X style={{ width: 15, height: 15 }} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '28px', overflowY: 'auto', flex: 1 }}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Clock } from 'lucide-react'

interface Slot { startTime: string; endTime: string }

export default function SlotPreview({ slots }: { slots: Slot[] }) {
  return (
    <AnimatePresence>
      {slots.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{ overflow: 'hidden' }}
        >
          <div style={{
            background: '#f0faf2', border: '1.5px solid rgba(97,206,112,0.25)',
            borderRadius: 12, padding: '16px 18px',
          }}>
            <p style={{
              fontSize: 12, fontWeight: 700, color: '#23A455',
              textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12,
            }}>
              ✅ {slots.length} slot(s) que serão criados
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {slots.map((slot, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: 'white', border: '1px solid rgba(97,206,112,0.25)',
                    color: '#23A455', fontSize: 13, fontWeight: 600,
                    padding: '6px 12px', borderRadius: 8,
                  }}
                >
                  <Clock style={{ width: 12, height: 12 }} />
                  {slot.startTime} – {slot.endTime}
                </motion.span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

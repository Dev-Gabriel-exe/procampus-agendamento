// ============================================================
// ARQUIVO: src/components/home/Navbar.tsx
// CAMINHO: procampus-agendamento/src/components/home/Navbar.tsx
// ============================================================

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Shield, CalendarDays } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px',
        background: scrolled ? 'rgba(13,40,24,0.97)' : 'rgba(13,40,24,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid rgba(97,206,112,0.12)' : '1px solid transparent',
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        height: 64,
        display: 'flex', alignItems: 'center',
      }}
    >
      <div style={{
        maxWidth: 1200, margin: '0 auto', width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo — sem sublinhado */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Pro Campus"
              style={{ width: 38, height: 38, objectFit: 'contain', display: 'block' }} />
            <div>
              <p style={{
                fontFamily: 'var(--font-display),"Roboto Slab",serif',
                fontWeight: 800, color: 'white', fontSize: 16,
                lineHeight: 1.1, letterSpacing: '-0.3px', margin: 0,
              }}>Pro Campus</p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, margin: 0 }}>
                Agendamento Pedagógico
              </p>
            </div>
          </div>
        </Link>

        {/* Botões */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/secretaria/login" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.85)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10, padding: '9px 18px',
                fontSize: 14, fontWeight: 500, cursor: 'pointer',
              }}
            >
              <Shield style={{ width: 14, height: 14 }} />
              Secretaria
            </motion.button>
          </Link>

          <Link href="/agendamento" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 8px 28px rgba(97,206,112,0.5)' }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg,#23A455,#61CE70)',
                color: 'white', border: 'none',
                borderRadius: 10, padding: '10px 20px',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(97,206,112,0.35)',
              }}
            >
              <CalendarDays style={{ width: 15, height: 15 }} />
              Agendar Reunião
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.nav>
  )
}
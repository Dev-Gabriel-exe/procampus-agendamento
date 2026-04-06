// components/home/Navbar.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { CalendarDays, Shield, Menu, X, ClipboardList, BookMarked } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const close = () => setMenuOpen(false)
    window.addEventListener('resize', close)
    return () => window.removeEventListener('resize', close)
  }, [])

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, height: 60,
          display: 'flex', alignItems: 'center',
          padding: '0 clamp(16px,4vw,32px)',
          background: scrolled ? 'rgba(5,14,8,0.92)' : 'rgba(5,14,8,0.6)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          borderBottom: `1px solid ${scrolled ? 'rgba(97,206,112,0.1)' : 'transparent'}`,
          transition: 'background 0.4s, border-color 0.4s',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* LOGO */}
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Pro Campus" style={{ width: 34, height: 34, objectFit: 'contain' }} />
              <div>
                <p style={{ fontFamily: '"Roboto Slab", Georgia, serif', fontWeight: 800, color: 'white', fontSize: 15, lineHeight: 1.1, letterSpacing: '-0.3px', margin: 0 }}>Pro Campus</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: 0, letterSpacing: '0.05em' }}>Plantão Escolar</p>
              </div>
            </div>
          </Link>

          {/* DESKTOP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="nav-desktop">
            <Link href="/secretaria/login" style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <Shield style={{ width: 13, height: 13 }} />Secretaria
              </motion.button>
            </Link>

            {/* Recuperação — verde escuro */}
            <Link href="/recuperacao" style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ scale: 1.04, boxShadow: '0 8px 30px rgba(35,164,85,0.55)' }} whileTap={{ scale: 0.97 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#166534,#23A455)', color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(35,164,85,0.25)', whiteSpace: 'nowrap', fontFamily: '"Roboto Slab", serif' }}>
                <BookMarked style={{ width: 14, height: 14 }} />Recuperação
              </motion.button>
            </Link>

            {/* Segunda Chamada — azul */}
            <Link href="/segunda-chamada" style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ scale: 1.04, boxShadow: '0 8px 30px rgba(64,84,178,0.55)' }} whileTap={{ scale: 0.97 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#4054B2,#6b7fe8)', color: 'white', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(64,84,178,0.3)', whiteSpace: 'nowrap', fontFamily: '"Roboto Slab", serif' }}>
                <ClipboardList style={{ width: 14, height: 14 }} />Segunda Chamada
              </motion.button>
            </Link>

            {/* Plantão — verde claro */}
            <Link href="/agendamento" style={{ textDecoration: 'none' }}>
              <motion.button whileHover={{ scale: 1.04, boxShadow: '0 8px 30px rgba(97,206,112,0.55)' }} whileTap={{ scale: 0.97 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#23A455,#61CE70)', color: '#041809', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(97,206,112,0.3)', whiteSpace: 'nowrap', fontFamily: '"Roboto Slab", serif' }}>
                <CalendarDays style={{ width: 14, height: 14 }} />Plantão Escolar
              </motion.button>
            </Link>
          </div>

          {/* MOBILE hamburger */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMenuOpen(v => !v)} className="nav-mobile"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 10, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {menuOpen ? <X style={{ width: 18, height: 18 }} /> : <Menu style={{ width: 18, height: 18 }} />}
          </motion.button>
        </div>
      </motion.nav>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
            style={{ position: 'fixed', top: 60, left: 0, right: 0, zIndex: 199, background: 'rgba(5,14,8,0.97)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(97,206,112,0.1)', padding: '20px clamp(16px,5vw,32px) 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>

            <Link href="/agendamento" style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
              <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'linear-gradient(135deg,#23A455,#61CE70)', color: '#041809', border: 'none', borderRadius: 14, padding: '15px 24px', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: '"Roboto Slab", serif' }}>
                <CalendarDays style={{ width: 18, height: 18 }} />Plantão Escolar
              </button>
            </Link>

            <Link href="/segunda-chamada" style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
              <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'linear-gradient(135deg,#4054B2,#6b7fe8)', color: 'white', border: 'none', borderRadius: 14, padding: '15px 24px', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: '"Roboto Slab", serif' }}>
                <ClipboardList style={{ width: 18, height: 18 }} />Segunda Chamada
              </button>
            </Link>

            <Link href="/recuperacao" style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
              <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'linear-gradient(135deg,#166534,#23A455)', color: 'white', border: 'none', borderRadius: 14, padding: '15px 24px', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: '"Roboto Slab", serif' }}>
                <BookMarked style={{ width: 18, height: 18 }} />Recuperação
              </button>
            </Link>

            <Link href="/secretaria/login" style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
              <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '14px 24px', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
                <Shield style={{ width: 15, height: 15 }} />Área da Secretaria
              </button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .nav-desktop { display: flex !important; }
        .nav-mobile  { display: none  !important; }
        @media (max-width: 700px) {
          .nav-desktop { display: none  !important; }
          .nav-mobile  { display: flex  !important; }
        }
      `}</style>
    </>
  )
}
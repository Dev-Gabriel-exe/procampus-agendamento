// ============================================================
// ARQUIVO: components/home/HeroSection.tsx
// ============================================================

'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import { CalendarDays, ArrowRight, Shield, Star } from 'lucide-react'

interface Particle {
  id: number; x: string; y: string; size: number
  color: string; duration: number; delay: number; yAmt: number
}

function FloatingParticles() {
  const [particles, setParticles] = useState<Particle[]>([])
  useEffect(() => {
    const colors = [
      'rgba(97,206,112,0.5)', 'rgba(97,206,112,0.2)',
      'rgba(110,193,228,0.4)', 'rgba(255,255,255,0.1)',
      'rgba(35,164,85,0.35)',
    ]
    setParticles(Array.from({ length: 22 }, (_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      y: `${Math.random() * 100}%`,
      size: Math.random() * 6 + 2,
      color: colors[i % colors.length],
      duration: Math.random() * 7 + 5,
      delay: Math.random() * 7,
      yAmt: Math.random() * 45 + 15,
    })))
  }, [])
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map(p => (
        <motion.div key={p.id}
          style={{ position: 'absolute', borderRadius: '50%', width: p.size, height: p.size, left: p.x, top: p.y, background: p.color }}
          animate={{ y: [0, -p.yAmt, 0], opacity: [0.2, 1, 0.2], scale: [1, 1.3, 1] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

export default function HeroSection() {
  const ref = useRef(null)
  const { scrollY } = useScroll()
  const y       = useTransform(scrollY, [0, 600], [0, 140])
  const opacity = useTransform(scrollY, [0, 350], [1, 0])

  const lines = [
    { title: 'Conectando famílias', gradient: false },
    { title: 'e educadores',        gradient: false },
    { title: 'com facilidade',      gradient: true  },
  ]

  return (
    <section ref={ref} style={{
      position: 'relative', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg,#040e09 0%,#0D2818 20%,#0f3318 45%,#163d1c 65%,#0D2818 85%,#040e09 100%)',
      overflow: 'hidden',
    }}>

      {/* Orbs animados */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '-15%', right: '-10%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle,rgba(97,206,112,0.13),transparent 70%)', filter: 'blur(70px)', pointerEvents: 'none' }}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        style={{ position: 'absolute', bottom: '-15%', left: '-8%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(110,193,228,0.1),transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }}
      />
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        style={{ position: 'absolute', top: '35%', left: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(97,206,112,0.07),transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }}
      />

      {/* Linhas decorativas */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[
          { left: '58%', rotate: '9deg', color: 'rgba(97,206,112,0.1)',  delay: 0.5 },
          { left: '28%', rotate: '-7deg', color: 'rgba(110,193,228,0.07)', delay: 0.8 },
          { left: '78%', rotate: '4deg', color: 'rgba(97,206,112,0.06)', delay: 1.2 },
        ].map((l, i) => (
          <motion.div key={i}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ duration: 2, delay: l.delay, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute', top: 0, left: l.left,
              width: 1, height: '100%',
              background: `linear-gradient(180deg,transparent,${l.color},transparent)`,
              transform: `rotate(${l.rotate})`,
              transformOrigin: 'top center',
            }}
          />
        ))}
      </div>

      <FloatingParticles />

      {/* Conteúdo */}
      <motion.div style={{ y, opacity, position: 'relative', zIndex: 10, width: '100%' }}>
        <div style={{
          textAlign: 'center',
          padding: 'clamp(80px,12vw,120px) clamp(20px,5vw,48px) clamp(48px,8vw,80px)',
          maxWidth: 920,
          margin: '0 auto',
        }}>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 999, padding: '8px 20px',
              marginBottom: 'clamp(28px,5vw,52px)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <motion.div
              animate={{ rotate: [0, 20, -20, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 2 }}
            >
              <Star style={{ width: 13, height: 13, fill: '#FCD34D', color: '#FCD34D' }} />
            </motion.div>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'clamp(11px,2vw,13px)', fontWeight: 500 }}>
              Grupo Educacional Pro Campus — Teresina, PI
            </span>
          </motion.div>

          {/* Título */}
          <div style={{ marginBottom: 'clamp(20px,3vw,32px)' }}>
            {lines.map((line, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 70 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.35 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
                <span style={{
                  display: 'block',
                  fontFamily: 'var(--font-display),"Roboto Slab",serif',
                  fontWeight: 900,
                  fontSize: 'clamp(38px, 8vw, 90px)',
                  lineHeight: 1.05,
                  letterSpacing: '-0.03em',
                  ...(line.gradient ? {
                    background: 'linear-gradient(135deg,#e8fef0 0%,#a8e6b4 40%,#61CE70 70%,#23A455 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  } : { color: 'white' }),
                }}>
                  {line.title}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Subtítulo */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.95 }}
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 'clamp(15px,2vw,19px)',
              maxWidth: 500, margin: '0 auto clamp(32px,5vw,52px)',
              lineHeight: 1.8,
            }}
          >
            Agende reuniões pedagógicas com os professores do Pro Campus
            de forma simples, rápida e totalmente online.
          </motion.p>

          {/* CTAs — empilhados no mobile, lado a lado no desktop */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.15 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              maxWidth: 360,
              margin: '0 auto',
            }}
          >
            <Link href="/agendamento" style={{ textDecoration: 'none', width: '100%' }}>
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 24px 70px rgba(255,255,255,0.25)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                  background: 'white', color: '#0D2818',
                  border: 'none', borderRadius: 16,
                  padding: '16px 32px',
                  fontSize: 'clamp(15px,2vw,17px)', fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
                  fontFamily: 'var(--font-display),"Roboto Slab",serif',
                  letterSpacing: '-0.3px',
                }}
              >
                <CalendarDays style={{ width: 20, height: 20, flexShrink: 0 }} />
                Agendar reunião
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ display: 'flex' }}
                >
                  <ArrowRight style={{ width: 18, height: 18 }} />
                </motion.span>
              </motion.button>
            </Link>

            <Link href="/secretaria/login" style={{ textDecoration: 'none', width: '100%' }}>
              <motion.button
                whileHover={{ scale: 1.03, background: 'rgba(255,255,255,0.15)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.8)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 16, padding: '15px 28px',
                  fontSize: 'clamp(13px,1.8vw,15px)', fontWeight: 600, cursor: 'pointer',
                  backdropFilter: 'blur(12px)',
                  transition: 'background 0.2s',
                }}
              >
                <Shield style={{ width: 16, height: 16, flexShrink: 0 }} />
                Área da Secretaria
              </motion.button>
            </Link>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            style={{ marginTop: 'clamp(40px,7vw,72px)' }}
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              style={{
                width: 26, height: 42, borderRadius: 13,
                border: '1.5px solid rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                padding: '5px 0', margin: '0 auto',
              }}
            >
              <motion.div
                animate={{ y: [0, 14, 0] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                style={{ width: 4, height: 8, borderRadius: 2, background: 'rgba(255,255,255,0.4)' }}
              />
            </motion.div>
          </motion.div>

        </div>
      </motion.div>

      {/* Fade bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
        background: 'linear-gradient(to bottom, transparent, #f0faf2)',
        pointerEvents: 'none',
      }} />
    </section>
  )
}
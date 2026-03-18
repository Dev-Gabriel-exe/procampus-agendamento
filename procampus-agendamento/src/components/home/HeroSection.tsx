// ============================================================
// ARQUIVO: src/components/home/HeroSection.tsx
// CAMINHO: procampus-agendamento/src/components/home/HeroSection.tsx
// ============================================================

'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import { CalendarDays, ArrowRight, Shield, Star, ChevronDown } from 'lucide-react'

interface Particle {
  id: number; x: string; y: string; size: number
  color: string; duration: number; delay: number; yAmt: number
}

function FloatingParticles() {
  const [particles, setParticles] = useState<Particle[]>([])
  useEffect(() => {
    const colors = [
      'rgba(97,206,112,0.4)', 'rgba(97,206,112,0.2)',
      'rgba(110,193,228,0.35)', 'rgba(255,255,255,0.12)',
    ]
    setParticles(Array.from({ length: 20 }, (_, i) => ({
      id: i, x: `${Math.random() * 100}%`, y: `${Math.random() * 100}%`,
      size: Math.random() * 5 + 2, color: colors[i % colors.length],
      duration: Math.random() * 6 + 5, delay: Math.random() * 6,
      yAmt: Math.random() * 35 + 15,
    })))
  }, [])
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map(p => (
        <motion.div key={p.id}
          style={{ position: 'absolute', borderRadius: '50%', width: p.size, height: p.size, left: p.x, top: p.y, background: p.color }}
          animate={{ y: [0, -p.yAmt, 0], opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

export default function HeroSection() {
  const ref = useRef(null)
  const { scrollY } = useScroll()
  const y       = useTransform(scrollY, [0, 600], [0, 120])
  const opacity = useTransform(scrollY, [0, 400], [1, 0])

  return (
    <section ref={ref} style={{
      position: 'relative', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg,#071410 0%,#0D2818 25%,#133d20 55%,#1a5428 80%,#0D2818 100%)',
      overflow: 'hidden',
    }}>

      {/* Orbs */}
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(97,206,112,0.12),transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(110,193,228,0.1),transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      {/* Linhas decorativas */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, left: '55%', width: 1, height: '100%', background: 'linear-gradient(180deg,transparent,rgba(97,206,112,0.08),transparent)', transform: 'rotate(10deg)' }} />
        <div style={{ position: 'absolute', top: 0, left: '30%', width: 1, height: '100%', background: 'linear-gradient(180deg,transparent,rgba(110,193,228,0.06),transparent)', transform: 'rotate(-6deg)' }} />
      </div>

      <FloatingParticles />

      <motion.div style={{ y, opacity }}
        className="hero-content"
        style={{
          position: 'relative', zIndex: 10,
          textAlign: 'center',
          padding: '100px 24px 60px',
          maxWidth: 900,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 999, padding: '8px 18px', marginBottom: 48,
          }}
        >
          <Star style={{ width: 13, height: 13, fill: '#FCD34D', color: '#FCD34D' }} />
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500 }}>
            Grupo Educacional Pro Campus — Teresina, PI
          </span>
        </motion.div>

        {/* Título centralizado */}
        <div style={{ marginBottom: 32 }}>
          {[
            { text: 'Conectando famílias', gradient: false },
            { text: 'e educadores',        gradient: false },
            { text: 'com facilidade',      gradient: true  },
          ].map((line, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.3 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <span style={{
                display: 'block',
                fontFamily: 'var(--font-display),"Roboto Slab",serif',
                fontWeight: 900,
                fontSize: 'clamp(44px, 7.5vw, 88px)',
                lineHeight: 1.05,
                letterSpacing: '-1.5px',
                ...(line.gradient ? {
                  background: 'linear-gradient(135deg,#ffffff 0%,#a8e6b4 50%,#61CE70 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                } : { color: 'white' }),
              }}>
                {line.text}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          style={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: 'clamp(16px, 2vw, 20px)',
            maxWidth: 560, margin: '0 auto 48px',
            lineHeight: 1.75,
          }}
        >
          Agende reuniões pedagógicas com os professores do Pro Campus
          de forma simples, rápida e totalmente online.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 16 }}
        >
          <Link href="/agendamento" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 20px 60px rgba(255,255,255,0.2)' }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'white',
                color: '#0D2818',
                border: 'none', borderRadius: 14,
                padding: '16px 32px',
                fontSize: 16, fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
                fontFamily: 'var(--font-display),"Roboto Slab",serif',
              }}
            >
              <CalendarDays style={{ width: 20, height: 20 }} />
              Agendar reunião
              <ArrowRight style={{ width: 18, height: 18 }} />
            </motion.button>
          </Link>

          <Link href="/secretaria/login" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.85)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 14, padding: '16px 28px',
                fontSize: 15, fontWeight: 600, cursor: 'pointer',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Shield style={{ width: 16, height: 16 }} />
              Área da Secretaria
            </motion.button>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          style={{
            marginTop: 72,
            display: 'flex', justifyContent: 'center',
            gap: 'clamp(32px, 6vw, 80px)',
          }}
        >
          {[
            { v: '3',     l: 'Unidades'    },
            { v: '30min', l: 'Por reunião' },
            { v: '100%',  l: 'Online'      },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <p style={{
                fontFamily: 'var(--font-display),"Roboto Slab",serif',
                fontWeight: 900, fontSize: 'clamp(28px,4vw,38px)',
                color: 'white', lineHeight: 1, margin: 0,
              }}>{s.v}</p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 6 }}>{s.l}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
        style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)' }}
      >
        <div style={{
          width: 26, height: 42, borderRadius: 13,
          border: '1.5px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          padding: '5px 0',
        }}>
          <motion.div
            animate={{ y: [0, 14, 0] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            style={{ width: 4, height: 8, borderRadius: 2, background: 'rgba(255,255,255,0.45)' }}
          />
        </div>
      </motion.div>

      {/* Fade bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 100,
        background: 'linear-gradient(to bottom, transparent, #f0faf2)',
        pointerEvents: 'none',
      }} />
    </section>
  )
}
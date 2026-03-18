// ============================================================
// ARQUIVO: components/home/HeroSection.tsx
// ============================================================

'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'
import Link from 'next/link'
import { CalendarDays, ArrowRight } from 'lucide-react'

function MagneticOrb() {
  const x = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 - 300 : 0)
  const y = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 - 300 : 0)
  const springX = useSpring(x, { stiffness: 60, damping: 20 })
  const springY = useSpring(y, { stiffness: 60, damping: 20 })

  useEffect(() => {
    const move = (e: MouseEvent) => { x.set(e.clientX - 300); y.set(e.clientY - 300) }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [x, y])

  return (
    <motion.div style={{
      position: 'fixed', top: 0, left: 0, width: 600, height: 600,
      borderRadius: '50%', pointerEvents: 'none', zIndex: 1,
      x: springX, y: springY,
      background: 'radial-gradient(circle, rgba(35,164,85,0.1) 0%, transparent 70%)',
      filter: 'blur(40px)',
    }} />
  )
}

export default function HeroSection() {
  const ref = useRef(null)
  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0])
  const heroScale   = useTransform(scrollY, [0, 500], [1, 0.93])
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const words = ['Conectando', 'famílias', 'e educadores', 'com facilidade']

  return (
    <>
      {mounted && <MagneticOrb />}

      <section ref={ref} style={{
        position: 'relative', minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#050e08', overflow: 'hidden',
      }}>

        {/* atmosphere */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 90% 55% at 50% 0%, rgba(35,164,85,0.2) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 50% 50% at 85% 85%, rgba(13,40,24,0.95) 0%, transparent 60%)' }} />

        {/* subtle dot grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.04,
          backgroundImage: 'radial-gradient(rgba(97,206,112,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* horizontal light streak */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 3, delay: 1.8, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute', top: '43%', left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent 0%, rgba(97,206,112,0.12) 25%, rgba(97,206,112,0.28) 50%, rgba(97,206,112,0.12) 75%, transparent 100%)',
            transformOrigin: 'center', pointerEvents: 'none',
          }}
        />

        {/* CONTENT */}
        <motion.div style={{ opacity: heroOpacity, scale: heroScale, position: 'relative', zIndex: 10, width: '100%' }}>
          <div style={{
            maxWidth: 1100, margin: '0 auto',
            padding: 'clamp(100px,14vw,160px) clamp(20px,6vw,80px) clamp(60px,8vw,100px)',
            textAlign: 'center',
          }}>

            {/* eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 'clamp(28px,5vw,52px)' }}
            >
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#61CE70', boxShadow: '0 0 8px #61CE70' }}
              />
              <span style={{
                fontSize: 'clamp(10px,1.4vw,12px)', fontWeight: 600,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.38)',
              }}>
                Grupo Educacional Pro Campus — Teresina, PI
              </span>
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#61CE70', boxShadow: '0 0 8px #61CE70' }}
              />
            </motion.div>

            {/* HEADLINE */}
            <h1 style={{ margin: '0 0 clamp(20px,3.5vw,36px)', padding: 0 }}>
              {words.map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 90, filter: 'blur(16px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 1.1, delay: 0.4 + i * 0.13, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    display: 'block',
                    fontFamily: '"Roboto Slab", Georgia, serif',
                    fontWeight: 900,
                    fontSize: 'clamp(42px, 10vw, 112px)',
                    lineHeight: 1.0,
                    letterSpacing: '-0.04em',
                    ...(i === words.length - 1 ? {
                      backgroundImage: 'linear-gradient(135deg, #b8ffc8 0%, #61CE70 45%, #1a8a3c 100%)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    } : { color: 'rgba(255,255,255,0.92)' }),
                  }}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            {/* subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 1.0 }}
              style={{
                fontSize: 'clamp(14px,1.8vw,19px)',
                color: 'rgba(255,255,255,0.35)',
                maxWidth: 460, margin: '0 auto clamp(36px,5.5vw,60px)',
                lineHeight: 1.8, fontWeight: 400,
              }}
            >
              Agende reuniões pedagógicas com os professores do Pro Campus
              de forma simples, rápida e totalmente online.
            </motion.p>

            {/* CTA — pill button, always above fold */}
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 1.25, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
            >
              <Link href="/agendamento" style={{ textDecoration: 'none' }}>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 80px rgba(97,206,112,0.5), 0 24px 60px rgba(0,0,0,0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 14,
                    background: 'linear-gradient(135deg, #23A455 0%, #61CE70 55%, #a8ffc0 100%)',
                    color: '#041809', border: 'none', borderRadius: 100,
                    padding: 'clamp(15px,2.2vw,19px) clamp(28px,5vw,52px)',
                    fontSize: 'clamp(15px,1.8vw,18px)', fontWeight: 800,
                    cursor: 'pointer', letterSpacing: '-0.02em',
                    boxShadow: '0 0 50px rgba(97,206,112,0.35), 0 20px 50px rgba(0,0,0,0.35)',
                    fontFamily: '"Roboto Slab", Georgia, serif',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <CalendarDays style={{ width: 20, height: 20, flexShrink: 0 }} />
                  Agendar reunião
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                    style={{ display: 'flex' }}
                  >
                    <ArrowRight style={{ width: 18, height: 18 }} />
                  </motion.span>
                </motion.button>
              </Link>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7 }}>
                <Link href="/secretaria/login" style={{
                  fontSize: 'clamp(11px,1.4vw,13px)', color: 'rgba(255,255,255,0.25)',
                  textDecoration: 'none', letterSpacing: '0.1em', fontWeight: 500,
                  borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 2,
                }}>
                  Área da Secretaria →
                </Link>
              </motion.div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 1.7 }}
              style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                gap: 'clamp(20px,5vw,64px)', marginTop: 'clamp(48px,8vw,88px)', flexWrap: 'wrap',
              }}
            >
              {[
                { value: '100%', label: 'Online' },
                { value: '30min', label: 'Por reunião' },
                { value: '24h', label: 'Disponível' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, color: '#61CE70',
                    fontFamily: '"Roboto Slab", serif', letterSpacing: '-0.03em',
                  }}>{s.value}</div>
                  <div style={{
                    fontSize: 'clamp(9px,1.1vw,11px)', color: 'rgba(255,255,255,0.25)',
                    letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 4,
                  }}>{s.label}</div>
                </div>
              ))}
            </motion.div>

          </div>
        </motion.div>

        {/* bottom fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 180,
          background: 'linear-gradient(to bottom, transparent, #f0faf2)',
          pointerEvents: 'none',
        }} />

      </section>
    </>
  )
}
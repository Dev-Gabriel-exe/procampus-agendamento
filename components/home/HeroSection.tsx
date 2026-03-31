// components/home/HeroSection.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'
import Link from 'next/link'
import { CalendarDays, ArrowRight, ClipboardList } from 'lucide-react'

function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return mobile
}

function MagneticOrb() {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 50, damping: 18 })
  const springY = useSpring(y, { stiffness: 50, damping: 18 })
  useEffect(() => {
    const move = (e: MouseEvent) => { x.set(e.clientX - 350); y.set(e.clientY - 350) }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [x, y])
  return (
    <motion.div style={{
      position: 'fixed', top: 0, left: 0, width: 700, height: 700,
      borderRadius: '50%', pointerEvents: 'none', zIndex: 1,
      x: springX, y: springY,
      background: 'radial-gradient(circle, rgba(35,164,85,0.09) 0%, transparent 65%)',
      filter: 'blur(60px)',
    }} />
  )
}

function AnimatedText({ text, delay = 0, gradient = false }: { text: string; delay?: number; gradient?: boolean }) {
  const chars = text.split('')
  return (
    <span style={{ display: 'inline-block', overflow: 'hidden' }}>
      {chars.map((char, i) => (
        <motion.span key={i}
          initial={{ y: '110%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          transition={{ duration: 0.65, delay: delay + i * 0.032, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: 'inline-block',
            ...(char === ' ' ? { width: '0.28em' } : {}),
            ...(gradient ? {
              backgroundImage: 'linear-gradient(135deg, #d0ffe0 0%, #61CE70 40%, #1e8c42 100%)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            } : { color: 'rgba(255,255,255,0.93)' }),
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  )
}

function Particles() {
  const [list, setList] = useState<any[]>([])
  useEffect(() => {
    setList(Array.from({ length: 18 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 3 + 1, dur: Math.random() * 10 + 8,
      delay: Math.random() * 8, drift: Math.random() * 40 + 20,
      opacity: Math.random() * 0.4 + 0.1,
    })))
  }, [])
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {list.map(p => (
        <motion.div key={p.id}
          style={{
            position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size, borderRadius: '50%',
            background: p.id % 3 === 0 ? '#61CE70' : p.id % 3 === 1 ? 'rgba(110,193,228,0.8)' : 'rgba(255,255,255,0.6)',
          }}
          animate={{ y: [0, -p.drift, 0], opacity: [p.opacity * 0.3, p.opacity, p.opacity * 0.3], scale: [1, 1.4, 1] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

export default function HeroSection() {
  const ref = useRef(null)
  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 700, 950], [1, 1, 0])
  const heroScale   = useTransform(scrollY, [0, 700, 950], [1, 1, 0.94])
  const heroY       = useTransform(scrollY, [0, 950], [0, -60])
  const [mounted, setMounted] = useState(false)
  const isMobile = useIsMobile()
  useEffect(() => { setMounted(true) }, [])

  return (
    <>
      {mounted && !isMobile && <MagneticOrb />}
      <section ref={ref} style={{
        position: 'relative', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#050e08', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 100% 60% at 50% -10%, rgba(35,164,85,0.22) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 40% 60% at 0% 50%, rgba(13,40,24,0.7) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 40% 60% at 100% 50%, rgba(13,40,24,0.7) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.035, backgroundImage: 'radial-gradient(rgba(97,206,112,1) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 3, delay: 0.5 }}
          style={{ position: 'absolute', width: 'min(900px, 90vw)', height: 'min(900px, 90vw)', borderRadius: '50%', border: '1px solid rgba(97,206,112,0.05)', pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 3, delay: 0.8 }}
          style={{ position: 'absolute', width: 'min(600px, 70vw)', height: 'min(600px, 70vw)', borderRadius: '50%', border: '1px solid rgba(97,206,112,0.07)', pointerEvents: 'none' }} />
        <Particles />

        <motion.div style={{ opacity: heroOpacity, scale: heroScale, y: heroY, position: 'relative', zIndex: 10, width: '100%' }}>
          <div style={{
            maxWidth: 1000, margin: '0 auto',
            padding: 'clamp(80px,14vw,160px) clamp(20px,6vw,80px) clamp(60px,8vw,100px)',
            textAlign: 'center',
          }}>

            {/* Eyebrow */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 'clamp(24px,5vw,56px)', flexWrap: 'wrap', justifyContent: 'center' }}>
              <motion.div animate={{ opacity: [1, 0.2, 1], scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2.5 }}
                style={{ width: 7, height: 7, borderRadius: '50%', background: '#61CE70', boxShadow: '0 0 10px rgba(97,206,112,0.8)', flexShrink: 0 }} />
              <span style={{ fontSize: 'clamp(9px,1.3vw,12px)', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                Grupo Educacional Pro Campus — Teresina, PI
              </span>
              <motion.div animate={{ opacity: [1, 0.2, 1], scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2.5, delay: 1.2 }}
                style={{ width: 7, height: 7, borderRadius: '50%', background: '#61CE70', boxShadow: '0 0 10px rgba(97,206,112,0.8)', flexShrink: 0 }} />
            </motion.div>

            {/* Headline */}
            <h1 style={{
              margin: '0 0 clamp(16px,3.5vw,36px)', padding: 0,
              fontFamily: '"Roboto Slab", Georgia, serif',
              fontWeight: 900, fontSize: 'clamp(38px, 9.5vw, 110px)',
              lineHeight: 1.0, letterSpacing: '-0.04em',
            }}>
              <div style={{ overflow: 'hidden', display: 'block', marginBottom: '0.04em' }}><AnimatedText text="Conectando" delay={0.3} /></div>
              <div style={{ overflow: 'hidden', display: 'block', marginBottom: '0.04em' }}><AnimatedText text="famílias" delay={0.55} /></div>
              <div style={{ overflow: 'hidden', display: 'block', marginBottom: '0.04em' }}><AnimatedText text="e educadores" delay={0.8} /></div>
              <div style={{ overflow: 'hidden', display: 'block' }}><AnimatedText text="com facilidade" delay={1.05} gradient /></div>
            </h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ fontSize: 'clamp(14px,1.8vw,18px)', color: 'rgba(255,255,255,0.32)', maxWidth: 480, margin: '0 auto clamp(28px,5vw,52px)', lineHeight: 1.8 }}
            >
              Agende reuniões com professores ou inscreva seu filho na prova de segunda chamada — tudo online, sem complicação.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 1.85, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}
            >
              <div style={{
                display: 'flex', gap: 12, justifyContent: 'center',
                flexDirection: isMobile ? 'column' : 'row',
                width: isMobile ? '100%' : 'auto',
                maxWidth: isMobile ? 320 : 'none',
              }}>
                {/* Agendamento */}
                <Link href="/agendamento" style={{ textDecoration: 'none', width: isMobile ? '100%' : 'auto' }}>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 0 90px rgba(97,206,112,0.55), 0 24px 60px rgba(0,0,0,0.4)' }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      width: isMobile ? '100%' : 'auto',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                      background: 'linear-gradient(135deg, #1d9447 0%, #23A455 40%, #61CE70 80%, #a8ffc0 100%)',
                      color: '#03150a', border: 'none', borderRadius: 100,
                      padding: 'clamp(14px,2vw,18px) clamp(24px,4vw,48px)',
                      fontSize: 'clamp(14px,1.6vw,17px)', fontWeight: 800,
                      cursor: 'pointer', letterSpacing: '-0.02em',
                      boxShadow: '0 0 60px rgba(97,206,112,0.4), 0 20px 50px rgba(0,0,0,0.3)',
                      fontFamily: '"Roboto Slab", Georgia, serif',
                    }}
                  >
                    <CalendarDays style={{ width: 18, height: 18, flexShrink: 0 }} />
                    Agendar plantão
                    <motion.span animate={{ x: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }} style={{ display: 'flex' }}>
                      <ArrowRight style={{ width: 16, height: 16 }} />
                    </motion.span>
                  </motion.button>
                </Link>

                {/* Segunda Chamada */}
                <Link href="/segunda-chamada" style={{ textDecoration: 'none', width: isMobile ? '100%' : 'auto' }}>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 0 60px rgba(64,84,178,0.45)' }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      width: isMobile ? '100%' : 'auto',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                      background: 'rgba(64,84,178,0.14)',
                      color: '#a0b0ff', border: '1.5px solid rgba(64,84,178,0.4)', borderRadius: 100,
                      padding: 'clamp(14px,2vw,18px) clamp(24px,4vw,48px)',
                      fontSize: 'clamp(14px,1.6vw,17px)', fontWeight: 800,
                      cursor: 'pointer', letterSpacing: '-0.02em',
                      fontFamily: '"Roboto Slab", Georgia, serif',
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    <ClipboardList style={{ width: 18, height: 18, flexShrink: 0 }} />
                    Segunda chamada
                    <ArrowRight style={{ width: 16, height: 16 }} />
                  </motion.button>
                </Link>
              </div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}>
                <Link href="/secretaria/login" style={{
                  fontSize: 'clamp(11px,1.3vw,13px)', color: 'rgba(255,255,255,0.22)',
                  textDecoration: 'none', letterSpacing: '0.1em', fontWeight: 500,
                  borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 2,
                }}>
                  Área da Secretaria →
                </Link>
              </motion.div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 2.1 }}
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'clamp(20px,5vw,72px)', marginTop: 'clamp(44px,8vw,96px)', flexWrap: 'wrap' }}
            >
              {[
                { value: '100%', label: 'Online' },
                { value: '20min', label: 'Por reunião' },
                { value: '2ª', label: 'Chamada' },
                { value: '24h', label: 'Disponível' },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 2.2 + i * 0.1 }} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(20px,3vw,32px)', fontWeight: 900, color: '#61CE70', fontFamily: '"Roboto Slab", serif', letterSpacing: '-0.03em', textShadow: '0 0 30px rgba(97,206,112,0.4)' }}>{s.value}</div>
                  <div style={{ fontSize: 'clamp(9px,1vw,11px)', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 5 }}>{s.label}</div>
                </motion.div>
              ))}
            </motion.div>

          </div>
        </motion.div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, background: 'linear-gradient(to bottom, transparent, #f0faf2)', pointerEvents: 'none' }} />
      </section>
    </>
  )
}
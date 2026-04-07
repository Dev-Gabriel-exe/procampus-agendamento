// ============================================================
// ARQUIVO: src/components/home/CTASection.tsx
// CAMINHO: procampus-agendamento/src/components/home/CTASection.tsx
// ============================================================
'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { CalendarDays, ArrowRight, ClipboardList, BookMarked } from 'lucide-react'

function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 540)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return mobile
}

interface Particle { id: number; x: string; y: string; size: number; color: string; dur: number; delay: number; yAmt: number }

function CTAParticles() {
  const [list, setList] = useState<Particle[]>([])
  useEffect(() => {
    setList(Array.from({ length: 14 }, (_, i) => ({
      id: i, x: `${Math.random() * 100}%`, y: `${Math.random() * 100}%`,
      size: Math.random() * 5 + 2,
      color: i % 2 === 0 ? 'rgba(97,206,112,0.35)' : 'rgba(255,255,255,0.12)',
      dur: Math.random() * 5 + 4, delay: Math.random() * 4, yAmt: Math.random() * 25 + 10,
    })))
  }, [])
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {list.map(p => (
        <motion.div key={p.id}
          style={{ position: 'absolute', borderRadius: '50%', width: p.size, height: p.size, left: p.x, top: p.y, background: p.color }}
          animate={{ y: [0, -p.yAmt, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

export default function CTASection() {
  const ref     = useRef(null)
  const inView  = useInView(ref, { once: true, margin: '-60px' })
  const isMobile = useIsMobile()

  return (
    <section style={{
      padding: 'clamp(64px,10vw,120px) clamp(16px,4vw,24px)', position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(160deg,#071410 0%,#0D2818 30%,#133d20 60%,#1a5428 100%)',
    }}>
      <CTAParticles />
      <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(97,206,112,0.12),transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(64,84,178,0.1),transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <motion.div ref={ref}
        initial={{ opacity: 0, y: 50 }} animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: 760, margin: '0 auto' }}
      >
        <span style={{ display: 'inline-block', background: 'rgba(97,206,112,0.15)', color: '#61CE70', border: '1px solid rgba(97,206,112,0.3)', fontWeight: 700, fontSize: 12, padding: '6px 16px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 24 }}>
          Comece agora
        </span>

        <h2 style={{ fontFamily: 'var(--font-display),"Roboto Slab",serif', fontWeight: 900, fontSize: 'clamp(28px,6vw,64px)', color: 'white', lineHeight: 1.05, letterSpacing: '-1.5px', marginBottom: 16 }}>
          O que você precisa{' '}
          <span style={{ background: 'linear-gradient(135deg,#ffffff 0%,#b8f5c2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            hoje?
          </span>
        </h2>

        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 'clamp(14px,2vw,18px)', lineHeight: 1.75, maxWidth: 500, margin: '0 auto 44px' }}>
          Seja para conversar com um professor ou inscrever na prova de segunda chamada — rápido, gratuito e sem complicação.
        </p>

        {/* Cards — stack vertically on mobile */}
        <div style={{
          display: 'flex',
          gap: 16,
          justifyContent: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'stretch',
          marginBottom: 28,
          maxWidth: isMobile ? 340 : 'none',
          margin: '0 auto 28px',
        }}>

          {/* Agendamento */}
          <Link href="/agendamento" style={{ textDecoration: 'none', flex: 1 }}>
            <motion.div
              whileHover={{ scale: 1.03, y: -4, boxShadow: '0 28px 60px rgba(255,255,255,0.15)' }}
              whileTap={{ scale: 0.97 }}
              style={{ background: 'white', borderRadius: 20, padding: 'clamp(20px,3vw,28px) clamp(20px,3vw,36px)', cursor: 'pointer', display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: 'center', gap: isMobile ? 14 : 12, boxShadow: '0 8px 40px rgba(0,0,0,0.2)', height: '100%' }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#e8f9eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CalendarDays style={{ width: 22, height: 22, color: '#23A455' }} />
              </div>
              <div style={{ textAlign: isMobile ? 'left' : 'center', flex: 1 }}>
                <p style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 800, fontSize: 15, color: '#0D2818', margin: 0, marginBottom: 3 }}>Agendar Plantão</p>
                <p style={{ fontSize: 12, color: '#6b8f72', margin: 0 }}>Com o professor do seu filho</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#23A455', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                {!isMobile && 'Acessar'} <ArrowRight style={{ width: 14, height: 14 }} />
              </div>
            </motion.div>
          </Link>

          {/* Segunda Chamada */}
          <Link href="/segunda-chamada" style={{ textDecoration: 'none', flex: 1 }}>
            <motion.div
              whileHover={{ scale: 1.03, y: -4, boxShadow: '0 28px 60px rgba(64,84,178,0.3)' }}
              whileTap={{ scale: 0.97 }}
              style={{ background: 'rgba(64,84,178,0.18)', border: '1.5px solid rgba(64,84,178,0.35)', backdropFilter: 'blur(16px)', borderRadius: 20, padding: 'clamp(20px,3vw,28px) clamp(20px,3vw,36px)', cursor: 'pointer', display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: 'center', gap: isMobile ? 14 : 12, height: '100%' }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(64,84,178,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ClipboardList style={{ width: 22, height: 22, color: '#a0b0ff' }} />
              </div>
              <div style={{ textAlign: isMobile ? 'left' : 'center', flex: 1 }}>
                <p style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 800, fontSize: 15, color: 'white', margin: 0, marginBottom: 3 }}>Segunda Chamada</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Inscrição na prova</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#a0b0ff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                {!isMobile && 'Acessar'} <ArrowRight style={{ width: 14, height: 14 }} />
              </div>
            </motion.div>
          </Link>

          {/* Recuperação */}
          <Link href="/recuperacao" style={{ textDecoration: 'none', flex: 1 }}>
            <motion.div
              whileHover={{ scale: 1.03, y: -4, boxShadow: '0 28px 60px rgba(249,115,22,0.3)' }}
              whileTap={{ scale: 0.97 }}
              style={{ background: 'rgba(249,115,22,0.18)', border: '1.5px solid rgba(249,115,22,0.35)', backdropFilter: 'blur(16px)', borderRadius: 20, padding: 'clamp(20px,3vw,28px) clamp(20px,3vw,36px)', cursor: 'pointer', display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: 'center', gap: isMobile ? 14 : 12, height: '100%' }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BookMarked style={{ width: 22, height: 22, color: '#faa54a' }} />
              </div>
              <div style={{ textAlign: isMobile ? 'left' : 'center', flex: 1 }}>
                <p style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 800, fontSize: 15, color: 'white', margin: 0, marginBottom: 3 }}>Recuperação</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Prova de recuperação</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#faa54a', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                {!isMobile && 'Acessar'} <ArrowRight style={{ width: 14, height: 14 }} />
              </div>
            </motion.div>
          </Link>

        </div>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>
          Sem cadastro · Sem senha · Confirmação imediata por e-mail · Plantão, 2ª Chamada e Recuperação
        </p>
      </motion.div>
    </section>
  )
}
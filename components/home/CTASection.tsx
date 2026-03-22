// ============================================================
// ARQUIVO: src/components/home/CTASection.tsx
// CAMINHO: procampus-agendamento/src/components/home/CTASection.tsx
// ============================================================
 'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { CalendarDays, ArrowRight, ClipboardList } from 'lucide-react'

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
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section style={{
      padding: '120px 24px', position: 'relative', overflow: 'hidden',
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

        <h2 style={{ fontFamily: 'var(--font-display),"Roboto Slab",serif', fontWeight: 900, fontSize: 'clamp(32px,6vw,64px)', color: 'white', lineHeight: 1.05, letterSpacing: '-1.5px', marginBottom: 20 }}>
          O que você precisa{' '}
          <span style={{ background: 'linear-gradient(135deg,#ffffff 0%,#b8f5c2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            hoje?
          </span>
        </h2>

        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 18, lineHeight: 1.75, maxWidth: 520, margin: '0 auto 52px' }}>
          Seja para conversar com um professor ou inscrever na prova de segunda chamada — é rápido, gratuito e sem complicação.
        </p>

        {/* Dual CTA cards */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>

          {/* Agendamento */}
          <Link href="/agendamento" style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{ scale: 1.04, y: -4, boxShadow: '0 28px 60px rgba(255,255,255,0.15)' }}
              whileTap={{ scale: 0.97 }}
              style={{ background: 'white', borderRadius: 20, padding: '28px 36px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, minWidth: 220, boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 14, background: '#e8f9eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarDays style={{ width: 24, height: 24, color: '#23A455' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 800, fontSize: 16, color: '#0D2818', margin: 0, marginBottom: 4 }}>Agendar Reunião</p>
                <p style={{ fontSize: 12, color: '#6b8f72', margin: 0 }}>Com o professor do seu filho</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#23A455', fontSize: 13, fontWeight: 700 }}>
                Acessar <ArrowRight style={{ width: 13, height: 13 }} />
              </div>
            </motion.div>
          </Link>

          {/* Segunda Chamada */}
          <Link href="/segunda-chamada" style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{ scale: 1.04, y: -4, boxShadow: '0 28px 60px rgba(64,84,178,0.3)' }}
              whileTap={{ scale: 0.97 }}
              style={{ background: 'rgba(64,84,178,0.18)', border: '1.5px solid rgba(64,84,178,0.35)', backdropFilter: 'blur(16px)', borderRadius: 20, padding: '28px 36px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, minWidth: 220 }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(64,84,178,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList style={{ width: 24, height: 24, color: '#a0b0ff' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 800, fontSize: 16, color: 'white', margin: 0, marginBottom: 4 }}>Segunda Chamada</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Inscrição na prova</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#a0b0ff', fontSize: 13, fontWeight: 700 }}>
                Acessar <ArrowRight style={{ width: 13, height: 13 }} />
              </div>
            </motion.div>
          </Link>

        </div>

        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>
          Sem cadastro · Sem senha · Confirmação imediata por e-mail
        </p>
      </motion.div>
    </section>
  )
}
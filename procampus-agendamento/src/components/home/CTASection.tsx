// ============================================================
// ARQUIVO: src/components/home/CTASection.tsx
// CAMINHO: procampus-agendamento/src/components/home/CTASection.tsx
// ============================================================
 
'use client'
 
import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { CalendarDays, ArrowRight } from 'lucide-react'
 
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
 
      <motion.div ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: 700, margin: '0 auto' }}
      >
        <span style={{
          display: 'inline-block',
          background: 'rgba(97,206,112,0.15)', color: '#61CE70',
          border: '1px solid rgba(97,206,112,0.3)',
          fontWeight: 700, fontSize: 12, padding: '6px 16px',
          borderRadius: 999, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 24,
        }}>
          Comece agora
        </span>
 
        <h2 style={{
          fontFamily: 'var(--font-display),"Roboto Slab",serif',
          fontWeight: 900, fontSize: 'clamp(32px,6vw,64px)',
          color: 'white', lineHeight: 1.05, letterSpacing: '-1.5px', marginBottom: 20,
        }}>
          Agende agora{' '}
          <span style={{
            background: 'linear-gradient(135deg,#ffffff 0%,#b8f5c2 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            sem complicação
          </span>
        </h2>
 
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 18, lineHeight: 1.75, marginBottom: 48, maxWidth: 500, margin: '0 auto 48px' }}>
          Sem cadastro. Sem senha. Só escolher o horário e confirmar.
        </p>
 
        <Link href="/agendamento" style={{ textDecoration: 'none' }}>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 24px 60px rgba(255,255,255,0.2)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 14,
              background: 'white', color: '#0D2818', border: 'none',
              borderRadius: 16, padding: '18px 40px',
              fontSize: 18, fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
              fontFamily: 'var(--font-display),"Roboto Slab",serif',
            }}
          >
            <CalendarDays style={{ width: 22, height: 22 }} />
            Agendar minha reunião
            <ArrowRight style={{ width: 20, height: 20 }} />
          </motion.button>
        </Link>
      </motion.div>
    </section>
  )
}
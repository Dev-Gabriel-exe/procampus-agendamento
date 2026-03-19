// ============================================================
// ARQUIVO: src/components/home/HowItWorks.tsx
// CAMINHO: procampus-agendamento/src/components/home/HowItWorks.tsx
// ============================================================
 
'use client'
 
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { GraduationCap, Clock, User, CheckCircle } from 'lucide-react'
 
const steps = [
  { n: '01', icon: GraduationCap, color: '#23A455', bg: '#e8f9eb', border: '#c3e6cb',
    title: 'Série e Disciplina', desc: 'Selecione a série do seu filho e a disciplina do professor.' },
  { n: '02', icon: Clock, color: '#4054B2', bg: '#eef1fb', border: '#c7d2fb',
    title: 'Escolha o Horário', desc: 'Veja os dias e horários disponíveis e clique no que preferir.' },
  { n: '03', icon: User, color: '#23A455', bg: '#e8f9eb', border: '#c3e6cb',
    title: 'Seus Dados', desc: 'Nome, e-mail, telefone, nome do filho e o motivo da reunião.' },
  { n: '04', icon: CheckCircle, color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4',
    title: 'Confirmado!', desc: 'E-mail instantâneo com link para salvar no Google Agenda.' },
]
 
export default function HowItWorks() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
 
  return (
    <section style={{ padding: '120px 24px', background: 'white' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
 
        <motion.div ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', marginBottom: 72 }}
        >
          <span style={{
            display: 'inline-block',
            background: '#e8f9eb', color: '#23A455',
            fontWeight: 700, fontSize: 12, padding: '6px 16px',
            borderRadius: 999, textTransform: 'uppercase', letterSpacing: 2,
            marginBottom: 16,
          }}>
            Simples assim
          </span>
          <h2 style={{
            fontFamily: 'var(--font-display),"Roboto Slab",serif',
            fontWeight: 800, fontSize: 'clamp(32px,5vw,52px)',
            color: '#0a1a0d', lineHeight: 1.1, letterSpacing: '-1px',
            margin: '0 0 16px',
          }}>
            Como funciona?
          </h2>
          <p style={{ color: '#6b8f72', fontSize: 18, maxWidth: 500, margin: '0 auto', lineHeight: 1.75 }}>
            Em menos de 2 minutos você agenda uma reunião de 20min com o professor do seu filho.
          </p>
        </motion.div>
 
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 24,
        }}>
          {steps.map((step, i) => {
            const ref2   = useRef(null)
            const inView2 = useInView(ref2, { once: true, margin: '-40px' })
            const Icon   = step.icon
            return (
              <motion.div key={i} ref={ref2}
                initial={{ opacity: 0, y: 40 }}
                animate={inView2 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  whileHover={{ y: -8, boxShadow: `0 24px 60px rgba(97,206,112,0.15)` }}
                  style={{
                    background: 'white', borderRadius: 20, padding: 28,
                    border: `2px solid ${step.border}`,
                    transition: 'all 0.3s', height: '100%', position: 'relative',
                  }}
                >
                  {/* Número decorativo */}
                  <div style={{
                    position: 'absolute', top: 16, right: 20,
                    fontFamily: 'var(--font-display),"Roboto Slab",serif',
                    fontSize: 72, fontWeight: 900, lineHeight: 1,
                    color: 'rgba(97,206,112,0.06)', userSelect: 'none',
                  }}>
                    {step.n}
                  </div>
 
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, marginBottom: 20,
                    background: step.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1.5px solid ${step.border}`,
                  }}>
                    <Icon style={{ width: 22, height: 22, color: step.color }} />
                  </div>
 
                  <p style={{ fontSize: 11, fontWeight: 700, color: step.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                    Etapa {step.n}
                  </p>
                  <h3 style={{
                    fontFamily: 'var(--font-display),"Roboto Slab",serif',
                    fontWeight: 700, fontSize: 18, color: '#0a1a0d', marginBottom: 10, lineHeight: 1.2,
                  }}>
                    {step.title}
                  </h3>
                  <p style={{ color: '#6b8f72', fontSize: 14, lineHeight: 1.7 }}>
                    {step.desc}
                  </p>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
 
      </div>
    </section>
  )
}
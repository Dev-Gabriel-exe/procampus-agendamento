// ============================================================
// ARQUIVO: src/components/home/FeaturesSection.tsx
// CAMINHO: procampus-agendamento/src/components/home/FeaturesSection.tsx
// ============================================================
 
'use client'
 
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { CalendarDays, Clock, Mail, Smartphone, Shield, Zap } from 'lucide-react'
 
const features = [
  { icon: CalendarDays, title: 'Agendamento Online',     desc: 'Marque reuniões a qualquer hora pelo celular ou computador.',                bg: '#e8f9eb', color: '#23A455' },
  { icon: Clock,        title: 'Horários em Tempo Real', desc: 'Veja os slots de 20 minutos disponíveis de cada professor sem conflitos.',                  bg: '#eef1fb', color: '#4054B2' },
  { icon: Mail,         title: 'Confirmação por E-mail', desc: 'Receba confirmação imediata com todos os detalhes da reunião.',               bg: '#e6f7f0', color: '#0f766e' },
  { icon: CalendarDays, title: 'Google Agenda',          desc: 'Adicione ao calendário com 1 clique e receba lembrete automático.',           bg: '#fef3e2', color: '#c2410c' },
  { icon: Shield,       title: 'Exclusivo Pro Campus',   desc: 'Desenvolvido especialmente para o Grupo Educacional Pro Campus.',             bg: '#e8f9eb', color: '#23A455' },
  { icon: Smartphone,   title: '100% Responsivo',        desc: 'Interface otimizada para celular, tablet e computador.',                     bg: '#e8f4fd', color: '#2980b9' },
]
 
export default function FeaturesSection() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
 
  return (
    <section style={{ padding: '120px 24px', background: '#f7fdf8' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
 
        <motion.div ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: 72 }}
        >
          <span style={{
            display: 'inline-block',
            background: 'white', color: '#23A455',
            fontWeight: 700, fontSize: 12, padding: '6px 16px',
            borderRadius: 999, textTransform: 'uppercase', letterSpacing: 2,
            marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          }}>
            Por que usar
          </span>
          <h2 style={{
            fontFamily: 'var(--font-display),"Roboto Slab",serif',
            fontWeight: 800, fontSize: 'clamp(32px,5vw,52px)',
            color: '#0a1a0d', lineHeight: 1.1, letterSpacing: '-1px', margin: 0,
          }}>
            Tudo que você precisa
          </h2>
        </motion.div>
 
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {features.map((f, i) => {
            const ref2   = useRef(null)
            const inView2 = useInView(ref2, { once: true, margin: '-40px' })
            const Icon   = f.icon
            return (
              <motion.div key={i} ref={ref2}
                initial={{ opacity: 0, y: 40 }}
                animate={inView2 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  whileHover={{ y: -6, boxShadow: '0 20px 60px rgba(97,206,112,0.12)' }}
                  style={{
                    background: 'white', borderRadius: 20, padding: 28,
                    border: '1px solid rgba(97,206,112,0.1)',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
                    transition: 'all 0.3s',
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, marginBottom: 18,
                    background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon style={{ width: 22, height: 22, color: f.color }} />
                  </div>
                  <h3 style={{
                    fontFamily: 'var(--font-display),"Roboto Slab",serif',
                    fontWeight: 700, fontSize: 17, color: '#0a1a0d', marginBottom: 8, lineHeight: 1.2,
                  }}>
                    {f.title}
                  </h3>
                  <p style={{ color: '#6b8f72', fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
 
      </div>
    </section>
  )
}
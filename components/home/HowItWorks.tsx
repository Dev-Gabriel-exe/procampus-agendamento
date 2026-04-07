// ============================================================
// ARQUIVO: src/components/home/HowItWorks.tsx
// CAMINHO: procampus-agendamento/src/components/home/HowItWorks.tsx
// ============================================================
'use client'
 
import { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { GraduationCap, Clock, User, CheckCircle, ClipboardList, BookOpen, CalendarDays, BookMarked } from 'lucide-react'
 
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
 
const flows = {
  reuniao: {
    label: 'Reunião com Professor',
    labelShort: 'Reunião',
    icon: CalendarDays,
    color: '#23A455',
    steps: [
      { n: '01', icon: GraduationCap, color: '#23A455', bg: '#e8f9eb', border: '#c3e6cb', title: 'Série e Disciplina', desc: 'Selecione a série do seu filho e a disciplina do professor que deseja conversar.' },
      { n: '02', icon: Clock,         color: '#4054B2', bg: '#eef1fb', border: '#c7d2fb', title: 'Escolha o Horário',  desc: 'Veja os dias e horários disponíveis e clique no slot de 20 minutos que preferir.' },
      { n: '03', icon: User,          color: '#23A455', bg: '#e8f9eb', border: '#c3e6cb', title: 'Seus Dados',         desc: 'Informe nome, e-mail, telefone, nome do filho e o motivo da reunião.' },
      { n: '04', icon: CheckCircle,   color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4', title: 'Confirmado!',        desc: 'E-mail instantâneo com todos os detalhes e link para salvar no Google Agenda.' },
    ],
  },
  segundaChamada: {
    label: 'Segunda Chamada',
    labelShort: '2ª Chamada',
    icon: ClipboardList,
    color: '#4054B2',
    steps: [
      { n: '01', icon: BookOpen,     color: '#4054B2', bg: '#eef1fb', border: '#c7d2fb', title: 'Série e Disciplina', desc: 'Selecione a série do seu filho e a disciplina da prova que não pôde realizar.' },
      { n: '02', icon: ClipboardList, color: '#23A455', bg: '#e8f9eb', border: '#c3e6cb', title: 'Escolha o Horário',  desc: 'Veja os horários disponíveis cadastrados pela secretaria para a prova.' },
      { n: '03', icon: User,          color: '#4054B2', bg: '#eef1fb', border: '#c7d2fb', title: 'Seus Dados',         desc: 'Informe seu nome, e-mail, WhatsApp e o nome do aluno para confirmar a inscrição.' },
      { n: '04', icon: CheckCircle,   color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4', title: 'Inscrito!',          desc: 'Confirmação por e-mail com data, horário e instruções para o dia da prova.' },
    ],
  },
  recuperacao: {
    label: 'Recuperação e Reforço',
    labelShort: 'Recuperação',
    icon: BookMarked,
    color: '#f97316',
    steps: [
      { n: '01', icon: GraduationCap, color: '#f97316', bg: '#fff7ed', border: '#fbcf8f', title: 'Série e Disciplina', desc: 'Selecione a série do seu filho e a disciplina em que precisa de reforço.' },
      { n: '02', icon: Clock,         color: '#f97316', bg: '#fff7ed', border: '#fbcf8f', title: 'Escolha o Horário',  desc: 'Veja os horários disponíveis com professores especializados em reforço.' },
      { n: '03', icon: User,          color: '#f97316', bg: '#fff7ed', border: '#fbcf8f', title: 'Seus Dados',         desc: 'Informe seu nome, e-mail, telefone e dificuldades específicas do aluno.' },
      { n: '04', icon: CheckCircle,   color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4', title: 'Agendado!',         desc: 'Confirmação por e-mail com cronograma personalizado de aulas.' },
    ],
  },
}
 
type FlowKey = keyof typeof flows
 
export default function HowItWorks() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [active, setActive] = useState<FlowKey>('reuniao')
  const isMobile = useIsMobile()
  const flow = flows[active]
 
  return (
    <section style={{ padding: 'clamp(64px,10vw,120px) clamp(16px,4vw,24px)', background: 'white' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
 
        {/* Header */}
        <motion.div ref={ref}
          initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', marginBottom: 40 }}
        >
          <span style={{ display: 'inline-block', background: '#e8f9eb', color: '#23A455', fontWeight: 700, fontSize: 12, padding: '6px 16px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
            Simples assim
          </span>
          <h2 style={{ fontFamily: 'var(--font-display),"Roboto Slab",serif', fontWeight: 800, fontSize: 'clamp(28px,5vw,52px)', color: '#0a1a0d', lineHeight: 1.1, letterSpacing: '-1px', margin: '0 0 14px' }}>
            Como funciona?
          </h2>
          <p style={{ color: '#6b8f72', fontSize: 'clamp(15px,2vw,18px)', maxWidth: 520, margin: '0 auto', lineHeight: 1.75 }}>
            Em menos de 2 minutos você resolve — seja para agendar uma reunião ou inscrever na segunda chamada.
          </p>
        </motion.div>
 
        {/* Tab switcher — full width on mobile, auto on desktop */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ display: 'flex', justifyContent: 'center', marginBottom: 44 }}
        >
          <div style={{
            display: 'flex',
            background: '#f0faf2', borderRadius: 14, padding: 4,
            border: '1.5px solid rgba(97,206,112,0.15)', gap: 4,
            width: isMobile ? '100%' : 'auto',
          }}>
            {(Object.keys(flows) as FlowKey[]).map(key => {
              const f = flows[key]
              const isActive = active === key
              const Icon = f.icon
              return (
                <button key={key} onClick={() => setActive(key)}
                  style={{
                    flex: isMobile ? 1 : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: isMobile ? '11px 8px' : '11px 22px',
                    borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontSize: isMobile ? 13 : 14,
                    fontWeight: 700, fontFamily: '"Roboto Slab", serif',
                    transition: 'all 0.25s ease',
                    background: isActive ? 'white' : 'transparent',
                    color: isActive ? (key === 'reuniao' ? '#23A455' : '#4054B2') : '#6b8f72',
                    boxShadow: isActive ? '0 2px 12px rgba(0,0,0,0.08)' : 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Icon style={{ width: 14, height: 14, flexShrink: 0 }} />
                  {isMobile ? f.labelShort : f.label}
                </button>
              )
            })}
          </div>
        </motion.div>
 
        {/* Steps grid */}
        <AnimatePresence mode="wait">
          <motion.div key={active}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
              gap: 'clamp(12px,2vw,24px)',
            }}
          >
            {flow.steps.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                >
                  <motion.div
                    whileHover={{ y: -8, boxShadow: '0 24px 60px rgba(97,206,112,0.15)' }}
                    style={{ background: 'white', borderRadius: 20, padding: 'clamp(20px,3vw,28px)', border: `2px solid ${step.border}`, transition: 'all 0.3s', height: '100%', position: 'relative' }}
                  >
                    <div style={{ position: 'absolute', top: 16, right: 20, fontFamily: '"Roboto Slab",serif', fontSize: 72, fontWeight: 900, lineHeight: 1, color: 'rgba(97,206,112,0.06)', userSelect: 'none' }}>
                      {step.n}
                    </div>
                    <div style={{ width: 52, height: 52, borderRadius: 14, marginBottom: 20, background: step.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${step.border}` }}>
                      <Icon style={{ width: 22, height: 22, color: step.color }} />
                    </div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: step.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                      Etapa {step.n}
                    </p>
                    <h3 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 700, fontSize: 18, color: '#0a1a0d', marginBottom: 10, lineHeight: 1.2 }}>
                      {step.title}
                    </h3>
                    <p style={{ color: '#6b8f72', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                      {step.desc}
                    </p>
                  </motion.div>
                </motion.div>
              )
            })}
          </motion.div>
        </AnimatePresence>
 
      </div>
    </section>
  )
}
 
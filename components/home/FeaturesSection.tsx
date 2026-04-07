// ============================================================
// ARQUIVO: src/components/home/FeaturesSection.tsx
// CAMINHO: procampus-agendamento/src/components/home/FeaturesSection.tsx
// ============================================================
'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { CalendarDays, Clock, Mail, Smartphone, Shield, ClipboardList, FileCheck, BookMarked } from 'lucide-react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const services = [
  {
    key: 'reuniao',
    href: '/agendamento',
    icon: CalendarDays,
    tag: 'Plantão Escolar',
    tagColor: '#23A455',
    tagBg: '#e8f9eb',
    title: 'Reuniões com Professores',
    desc: 'Escolha o professor, o horário disponível e confirme em menos de 2 minutos. Tudo online, sem precisar ligar para a escola.',
    accentColor: '#23A455',
    borderColor: 'rgba(97,206,112,0.25)',
    glowColor: 'rgba(97,206,112,0.08)',
  },
  {
    key: 'segunda',
    href: '/segunda-chamada',
    icon: ClipboardList,
    tag: 'Segunda Chamada',
    tagColor: '#4054B2',
    tagBg: '#eef1fb',
    title: 'Inscrição em Prova',
    desc: 'Inscreva seu filho na prova de segunda chamada pelo celular. Horários definidos pela secretaria, confirmação imediata por e-mail.',
    accentColor: '#4054B2',
    borderColor: 'rgba(64,84,178,0.25)',
    glowColor: 'rgba(64,84,178,0.06)',
  },
  {
    key: 'recuperacao',
    href: '/recuperacao',
    icon: BookMarked,
    tag: 'Recuperação',
    tagColor: '#f97316',
    tagBg: '#fff7ed',
    title: 'Inscrição em Prova',
    desc: 'Inscreva seu filho para fazer a prova de recuperação. Horários agendados pela secretaria com confirmação imediata por e-mail.',
    accentColor: '#f97316',
    borderColor: 'rgba(249,115,22,0.25)',
    glowColor: 'rgba(249,115,22,0.06)',
  },
]

const features = [
  { icon: Clock,        title: 'Horários em Tempo Real', desc: 'Slots atualizados automaticamente — nada de horários já ocupados.',         bg: '#eef1fb', color: '#4054B2' },
  { icon: Mail,         title: 'Confirmação por E-mail', desc: 'Receba um e-mail instantâneo com todos os detalhes após agendar.',            bg: '#e6f7f0', color: '#0f766e' },
  { icon: CalendarDays, title: 'Google Agenda',          desc: 'Adicione ao calendário com 1 clique e receba lembrete automático.',           bg: '#fef3e2', color: '#c2410c' },
  { icon: FileCheck,    title: 'Sem Cadastro',           desc: 'Nenhum login ou senha necessário. Preencha e pronto.',                       bg: '#e8f9eb', color: '#23A455' },
  { icon: Smartphone,   title: '100% Responsivo',        desc: 'Interface otimizada para celular, tablet e computador.',                     bg: '#e8f4fd', color: '#2980b9' },
  { icon: Shield,       title: 'Exclusivo Pro Campus',   desc: 'Desenvolvido especialmente para o Grupo Educacional Pro Campus.',            bg: '#e8f9eb', color: '#23A455' },
]

export default function FeaturesSection() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section style={{ padding: 'clamp(64px,10vw,120px) clamp(16px,4vw,24px)', background: '#f7fdf8' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <motion.div ref={ref}
          initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: 48 }}
        >
          <span style={{ display: 'inline-block', background: 'white', color: '#23A455', fontWeight: 700, fontSize: 12, padding: '6px 16px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            Nossos serviços
          </span>
          <h2 style={{ fontFamily: 'var(--font-display),"Roboto Slab",serif', fontWeight: 800, fontSize: 'clamp(28px,5vw,52px)', color: '#0a1a0d', lineHeight: 1.1, letterSpacing: '-1px', margin: 0 }}>
            Tudo que você precisa
          </h2>
        </motion.div>

        {/* Service cards — minmax com min() garante coluna única em mobile */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
          gap: 'clamp(12px,2vw,20px)',
          marginBottom: 48,
        }}>
          {services.map((s, i) => {
            const ref2    = useRef(null)
            const inView2 = useInView(ref2, { once: true, margin: '-40px' })
            const Icon    = s.icon
            return (
              <motion.div key={s.key} ref={ref2}
                initial={{ opacity: 0, y: 40 }} animate={inView2 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  whileHover={{ y: -6, boxShadow: `0 28px 70px ${s.glowColor.replace('0.06', '0.2')}` }}
                  style={{ background: 'white', borderRadius: 24, padding: 'clamp(20px,3vw,32px)', border: `1.5px solid ${s.borderColor}`, boxShadow: `0 4px 24px ${s.glowColor}`, transition: 'all 0.3s', height: '100%' }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: s.tagBg, borderRadius: 999, padding: '5px 12px', marginBottom: 20 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.tagColor }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: s.tagColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.tag}</span>
                  </div>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: s.tagBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, border: `1.5px solid ${s.borderColor}` }}>
                    <Icon style={{ width: 26, height: 26, color: s.accentColor }} />
                  </div>
                  <h3 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 800, fontSize: 'clamp(18px,2.5vw,22px)', color: '#0a1a0d', marginBottom: 10, lineHeight: 1.2 }}>
                    {s.title}
                  </h3>
                  <p style={{ color: '#6b8f72', fontSize: 'clamp(13px,1.5vw,15px)', lineHeight: 1.75, marginBottom: 24 }}>
                    {s.desc}
                  </p>
                  <Link href={s.href} style={{ textDecoration: 'none' }}>
                    <motion.button
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: `1.5px solid ${s.borderColor}`, background: s.tagBg, color: s.accentColor, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: '"Roboto Slab",serif', transition: 'all 0.2s' }}
                    >
                      Acessar <ArrowRight style={{ width: 14, height: 14 }} />
                    </motion.button>
                  </Link>
                </motion.div>
              </motion.div>
            )
          })}
        </div>

        {/* Divider */}
        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.3 }}
          style={{ textAlign: 'center', marginBottom: 36 }}>
          <span style={{ display: 'inline-block', background: 'white', color: '#6b8f72', fontWeight: 700, fontSize: 11, padding: '5px 14px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            Recursos inclusos
          </span>
        </motion.div>

        {/* Features grid — cards horizontais, coluna única em mobile */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
          gap: 'clamp(10px,1.5vw,16px)',
        }}>
          {features.map((f, i) => {
            const ref2    = useRef(null)
            const inView2 = useInView(ref2, { once: true, margin: '-40px' })
            const Icon    = f.icon
            return (
              <motion.div key={i} ref={ref2}
                initial={{ opacity: 0, y: 30 }} animate={inView2 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  whileHover={{ y: -4, boxShadow: '0 16px 48px rgba(97,206,112,0.1)' }}
                  style={{ background: 'white', borderRadius: 16, padding: '18px 20px', border: '1px solid rgba(97,206,112,0.1)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', transition: 'all 0.3s', display: 'flex', alignItems: 'flex-start', gap: 14 }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 17, height: 17, color: f.color }} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: '"Roboto Slab",serif', fontWeight: 700, fontSize: 14, color: '#0a1a0d', marginBottom: 5, lineHeight: 1.2 }}>{f.title}</h3>
                    <p style={{ color: '#6b8f72', fontSize: 13, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
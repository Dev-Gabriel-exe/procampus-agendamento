'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Search, Printer } from 'lucide-react'
import { formatDateShort } from '@/lib/slots'

interface FiltrosSemanaProps {
  currentWeek: Date
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  search: string
  onSearch: (v: string) => void
  weekStart: Date
  weekEnd: Date
}

export default function FiltrosSemana({
  currentWeek, onPrev, onNext, onToday,
  search, onSearch, weekStart, weekEnd,
}: FiltrosSemanaProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
      className="no-print">

      {/* Info da semana */}
      <div>
        <h2 style={{
          fontFamily: 'var(--font-display),"Roboto Slab",serif',
          fontWeight: 700, fontSize: 22, color: '#0a1a0d',
        }}>
          Agendamentos da Semana
        </h2>
        <p style={{ color: '#6b8f72', fontSize: 13, marginTop: 3 }}>
          {formatDateShort(weekStart)} — {formatDateShort(weekEnd)}
        </p>
      </div>

      {/* Controles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

        {/* Busca */}
        <div style={{ position: 'relative' }}>
          <Search style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            width: 15, height: 15, color: '#6b8f72', pointerEvents: 'none',
          }} />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            style={{
              paddingLeft: 36, paddingRight: 14, paddingTop: 9, paddingBottom: 9,
              borderRadius: 10, border: '1.5px solid rgba(97,206,112,0.2)',
              fontSize: 13, outline: 'none', background: 'white',
              width: 180, transition: 'all 0.2s', fontFamily: 'inherit',
            }}
            onFocus={e => { e.target.style.borderColor = '#23A455'; e.target.style.boxShadow = '0 0 0 3px rgba(97,206,112,0.1)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.boxShadow = 'none' }}
          />
        </div>

        {/* Navegação de semana */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2,
          background: 'white', border: '1.5px solid rgba(97,206,112,0.2)',
          borderRadius: 10, padding: 4,
        }}>
          <button onClick={onPrev} style={{ padding: '6px 8px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 7, display: 'flex', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f0faf2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <ChevronLeft style={{ width: 15, height: 15, color: '#3d5c42' }} />
          </button>
          <button onClick={onToday} style={{
            padding: '6px 12px', border: 'none', background: 'transparent',
            cursor: 'pointer', borderRadius: 7, fontSize: 12, fontWeight: 600,
            color: '#23A455', transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#f0faf2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            Hoje
          </button>
          <button onClick={onNext} style={{ padding: '6px 8px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 7, display: 'flex', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f0faf2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <ChevronRight style={{ width: 15, height: 15, color: '#3d5c42' }} />
          </button>
        </div>

        {/* Imprimir */}
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => window.print()}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'linear-gradient(135deg,#23A455,#61CE70)',
            color: 'white', border: 'none', borderRadius: 10,
            padding: '9px 18px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', boxShadow: '0 4px 16px rgba(97,206,112,0.3)',
          }}
        >
          <Printer style={{ width: 15, height: 15 }} />
          Imprimir
        </motion.button>
      </div>
    </div>
  )
}

// components/secretaria/FiltrosSemana.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Printer, Filter, X, ChevronDown } from 'lucide-react'
import { formatDateShort } from '@/lib/slots'

const GRADES = [
  'Educação Infantil',
  '1º Ano Fundamental','2º Ano Fundamental','3º Ano Fundamental',
  '4º Ano Fundamental','5º Ano Fundamental','6º Ano Fundamental',
  '7º Ano Fundamental','8º Ano Fundamental','9º Ano Fundamental',
  '1ª Série Médio','2ª Série Médio','3ª Série Médio',
]

export interface Filtros {
  search:     string
  dateFrom:   string   // 'YYYY-MM-DD' ou ''
  dateTo:     string
  grade:      string
  discipline: string
}

interface FiltrosSemanaProps {
  filtros: Filtros
  onFiltros: (f: Filtros) => void
  disciplines: string[]   // lista dinâmica vinda dos agendamentos
  totalFiltrado: number
  totalGeral: number
  onPrint: () => void
}

export default function FiltrosSemana({
  filtros, onFiltros, disciplines,
  totalFiltrado, totalGeral, onPrint,
}: FiltrosSemanaProps) {
  const [expanded, setExpanded] = useState(false)

  function set(field: keyof Filtros, value: string) {
    onFiltros({ ...filtros, [field]: value })
  }

  function clear() {
    onFiltros({ search: '', dateFrom: '', dateTo: '', grade: '', discipline: '' })
  }

  const hasFilter = filtros.dateFrom || filtros.dateTo || filtros.grade || filtros.discipline
  const activeCount = [filtros.dateFrom, filtros.dateTo, filtros.grade, filtros.discipline].filter(Boolean).length

  return (
    <div className="no-print" style={{ background: 'white', borderRadius: 16, border: '1.5px solid rgba(97,206,112,0.15)', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>

      {/* ── Linha principal ── */}
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>

        {/* Título + contador */}
        <div style={{ flex: 1, minWidth: 160 }}>
          <h2 style={{ fontFamily: 'var(--font-display),"Roboto Slab",serif', fontWeight: 700, fontSize: 18, color: '#0a1a0d', margin: 0 }}>
            Agendamentos
          </h2>
          <p style={{ color: '#6b8f72', fontSize: 12, marginTop: 2 }}>
            {totalFiltrado === totalGeral
              ? `${totalGeral} no período`
              : `${totalFiltrado} de ${totalGeral} (filtrado)`}
          </p>
        </div>

        {/* Busca rápida */}
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#6b8f72', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Buscar responsável, aluno..."
            value={filtros.search}
            onChange={e => set('search', e.target.value)}
            style={{
              paddingLeft: 32, paddingRight: 14, paddingTop: 8, paddingBottom: 8,
              borderRadius: 9, border: '1.5px solid rgba(97,206,112,0.2)',
              fontSize: 13, outline: 'none', background: '#fafdf9',
              width: 'clamp(160px, 25vw, 240px)', fontFamily: 'inherit', color: '#0a1a0d',
            }}
            onFocus={e => { e.target.style.borderColor = '#23A455'; e.target.style.boxShadow = '0 0 0 3px rgba(97,206,112,0.1)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.boxShadow = 'none' }}
          />
        </div>

        {/* Botão filtros avançados */}
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 14px', borderRadius: 9,
            border: `1.5px solid ${hasFilter ? '#23A455' : 'rgba(97,206,112,0.2)'}`,
            background: hasFilter ? '#f0faf2' : 'white',
            color: hasFilter ? '#23A455' : '#6b8f72',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Filter style={{ width: 14, height: 14 }} />
          Filtros
          {activeCount > 0 && (
            <span style={{
              background: '#23A455', color: 'white',
              borderRadius: '50%', width: 18, height: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700,
            }}>{activeCount}</span>
          )}
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown style={{ width: 13, height: 13 }} />
          </motion.div>
        </button>

        {/* Limpar filtros */}
        {hasFilter && (
          <button
            onClick={clear}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '8px 12px', borderRadius: 9,
              border: '1.5px solid rgba(239,68,68,0.2)',
              background: '#fef2f2', color: '#dc2626',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <X style={{ width: 13, height: 13 }} />
            Limpar
          </button>
        )}

        {/* Imprimir */}
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={onPrint}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'linear-gradient(135deg,#23A455,#61CE70)',
            color: 'white', border: 'none', borderRadius: 9,
            padding: '8px 16px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', boxShadow: '0 4px 14px rgba(97,206,112,0.3)',
          }}
        >
          <Printer style={{ width: 14, height: 14 }} />
          Imprimir
        </motion.button>
      </div>

      {/* ── Filtros avançados expansíveis ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              borderTop: '1px solid rgba(97,206,112,0.1)',
              padding: '16px 20px',
              background: '#fafdfb',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
            }}>

              {/* Data de */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b8f72', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Data inicial
                </label>
                <input
                  type="date"
                  value={filtros.dateFrom}
                  onChange={e => set('dateFrom', e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 9,
                    border: '1.5px solid rgba(97,206,112,0.2)',
                    fontSize: 13, outline: 'none', background: 'white',
                    fontFamily: 'inherit', color: '#0a1a0d',
                  }}
                  onFocus={e => e.target.style.borderColor = '#23A455'}
                  onBlur={e => e.target.style.borderColor = 'rgba(97,206,112,0.2)'}
                />
              </div>

              {/* Data até */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b8f72', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Data final
                </label>
                <input
                  type="date"
                  value={filtros.dateTo}
                  onChange={e => set('dateTo', e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 9,
                    border: '1.5px solid rgba(97,206,112,0.2)',
                    fontSize: 13, outline: 'none', background: 'white',
                    fontFamily: 'inherit', color: '#0a1a0d',
                  }}
                  onFocus={e => e.target.style.borderColor = '#23A455'}
                  onBlur={e => e.target.style.borderColor = 'rgba(97,206,112,0.2)'}
                />
              </div>

              {/* Série */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b8f72', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Série
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={filtros.grade}
                    onChange={e => set('grade', e.target.value)}
                    style={{
                      width: '100%', padding: '8px 32px 8px 12px', borderRadius: 9,
                      border: '1.5px solid rgba(97,206,112,0.2)',
                      fontSize: 13, outline: 'none', background: 'white',
                      appearance: 'none', fontFamily: 'inherit', color: filtros.grade ? '#0a1a0d' : '#9ca3af',
                      cursor: 'pointer',
                    }}
                    onFocus={e => e.target.style.borderColor = '#23A455'}
                    onBlur={e => e.target.style.borderColor = 'rgba(97,206,112,0.2)'}
                  >
                    <option value="">Todas as séries</option>
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <ChevronDown style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#6b8f72', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Disciplina */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b8f72', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Disciplina
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={filtros.discipline}
                    onChange={e => set('discipline', e.target.value)}
                    style={{
                      width: '100%', padding: '8px 32px 8px 12px', borderRadius: 9,
                      border: '1.5px solid rgba(97,206,112,0.2)',
                      fontSize: 13, outline: 'none', background: 'white',
                      appearance: 'none', fontFamily: 'inherit', color: filtros.discipline ? '#0a1a0d' : '#9ca3af',
                      cursor: 'pointer',
                    }}
                    onFocus={e => e.target.style.borderColor = '#23A455'}
                    onBlur={e => e.target.style.borderColor = 'rgba(97,206,112,0.2)'}
                  >
                    <option value="">Todas as disciplinas</option>
                    {disciplines.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <ChevronDown style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#6b8f72', pointerEvents: 'none' }} />
                </div>
              </div>

            </div>

            {/* Resumo do filtro ativo */}
            {hasFilter && (
              <div style={{ padding: '10px 20px 14px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#6b8f72' }}>Filtrando por:</span>
                {filtros.dateFrom && <span style={chip}>{filtros.dateFrom}</span>}
                {filtros.dateTo   && <span style={chip}>até {filtros.dateTo}</span>}
                {filtros.grade    && <span style={chip}>{filtros.grade}</span>}
                {filtros.discipline && <span style={chip}>{filtros.discipline}</span>}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const chip: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
  background: '#f0faf2', color: '#23A455', border: '1px solid rgba(97,206,112,0.25)',
}
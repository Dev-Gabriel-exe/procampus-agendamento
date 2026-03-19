// components/secretaria/PrintView.tsx
import { formatDateShort } from '@/lib/slots'
import type { Filtros } from './FiltrosSemana'

interface PrintViewProps {
  filtros: Filtros
  total: number
  confirmed: number
  cancelled: number
}

export default function PrintView({ filtros, total, confirmed, cancelled }: PrintViewProps) {
  const hasDateFilter = filtros.dateFrom || filtros.dateTo
  const periodoLabel = hasDateFilter
    ? `${filtros.dateFrom ? filtros.dateFrom : '—'} a ${filtros.dateTo ? filtros.dateTo : '—'}`
    : 'Todos os períodos'

  return (
    <div className="print-only" style={{ marginBottom: 32 }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #23A455', paddingBottom: 16, marginBottom: 20 }}>
        <h1 style={{ fontFamily: '"Roboto Slab",serif', fontSize: 24, fontWeight: 800, color: '#0a1a0d' }}>
          Pro Campus — Agendamentos Pedagógicos
        </h1>
        <p style={{ color: '#6b7280', marginTop: 6, fontSize: 14 }}>
          Período: {periodoLabel}
          {filtros.grade && ` · Série: ${filtros.grade}`}
          {filtros.discipline && ` · Disciplina: ${filtros.discipline}`}
          {filtros.search && ` · Busca: "${filtros.search}"`}
        </p>
        <p style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>
          Gerado em {new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Fortaleza' })} às{' '}
          {new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Fortaleza', hour: '2-digit', minute: '2-digit' })}
          {' '}— {total} agendamento(s) | {confirmed} confirmado(s) | {cancelled} cancelado(s)
        </p>
      </div>
    </div>
  )
}
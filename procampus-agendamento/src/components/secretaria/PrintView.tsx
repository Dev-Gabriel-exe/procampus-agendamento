import { formatDateShort } from '@/lib/slots'

interface PrintViewProps {
  weekStart: Date
  weekEnd: Date
  total: number
  confirmed: number
}

export default function PrintView({ weekStart, weekEnd, total, confirmed }: PrintViewProps) {
  return (
    <div className="print-only" style={{ marginBottom: 32 }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #23A455', paddingBottom: 16, marginBottom: 20 }}>
        <h1 style={{ fontFamily: '"Roboto Slab",serif', fontSize: 24, fontWeight: 800, color: '#0a1a0d' }}>
          Pro Campus — Agendamentos Pedagógicos
        </h1>
        <p style={{ color: '#6b8f72', marginTop: 6, fontSize: 14 }}>
          Semana: {formatDateShort(weekStart)} a {formatDateShort(weekEnd)}
        </p>
        <p style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>
          Gerado em {new Date().toLocaleDateString('pt-BR')} — {total} agendamento(s) | {confirmed} confirmado(s)
        </p>
      </div>
    </div>
  )
}

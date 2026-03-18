'use client'
import { Check } from 'lucide-react'

const STEPS = ['Série e Disciplina', 'Horário', 'Seus Dados', 'Confirmação']

export default function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 40 }}>
      {STEPS.map((label, i) => {
        const step   = i + 1
        const done   = step < current
        const active = step === current
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, border: '2px solid', transition: 'all 0.3s',
                background: done ? '#61CE70' : active ? '#23A455' : 'white',
                borderColor: done ? '#61CE70' : active ? '#23A455' : '#dde8df',
                color: done || active ? 'white' : '#aab8ad',
                boxShadow: active ? '0 4px 16px rgba(35,164,85,0.35)' : 'none',
              }}>
                {done ? <Check style={{ width: 15, height: 15 }} /> : step}
              </div>
              <span style={{
                fontSize: 11, marginTop: 6, fontWeight: 600,
                color: active ? '#23A455' : done ? '#61CE70' : '#aab8ad',
                display: 'none', whiteSpace: 'nowrap',
              }} className="sm-show">
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                width: 60, height: 2, margin: '0 6px 20px',
                borderRadius: 2, transition: 'background 0.3s',
                background: done ? '#61CE70' : '#e4ede5',
              }} />
            )}
          </div>
        )
      })}
      <style>{`.sm-show { display: block !important; }`}</style>
    </div>
  )
}
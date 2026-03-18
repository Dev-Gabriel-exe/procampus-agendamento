'use client'
import { ReactNode } from 'react'

type BadgeVariant = 'green' | 'blue' | 'red' | 'gray' | 'yellow' | 'white'

const variants: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
  green:  { bg: '#e8f9eb',             color: '#23A455', border: 'rgba(97,206,112,0.3)' },
  blue:   { bg: '#eef1fb',             color: '#4054B2', border: 'rgba(64,84,178,0.2)'  },
  red:    { bg: '#fef2f2',             color: '#dc2626', border: 'rgba(239,68,68,0.25)' },
  gray:   { bg: '#f3f4f6',             color: '#6b7280', border: 'rgba(107,114,128,0.2)'},
  yellow: { bg: '#fef9c3',             color: '#ca8a04', border: 'rgba(202,138,4,0.25)' },
  white:  { bg: 'rgba(255,255,255,0.1)', color: 'white', border: 'rgba(255,255,255,0.2)' },
}

export default function Badge({
  children, variant = 'green', icon,
}: {
  children: ReactNode; variant?: BadgeVariant; icon?: ReactNode
}) {
  const v = variants[variant]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 12px', borderRadius: 999,
      background: v.bg, color: v.color,
      border: `1px solid ${v.border}`,
      fontSize: 12, fontWeight: 600,
      letterSpacing: '0.03em',
    }}>
      {icon && <span style={{ display: 'flex' }}>{icon}</span>}
      {children}
    </span>
  )
}

// components/secretaria/RoleBadge.tsx
'use client'

import { useSession } from 'next-auth/react'

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  geral: { label: 'Acesso Geral',  color: '#23A455', bg: 'rgba(97,206,112,0.15)' },
  fund1: { label: 'Fund. I',       color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  fund2: { label: 'Fund. II + EM', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
}

export default function RoleBadge() {
  const { data: session, status } = useSession()

  // Não renderiza nada enquanto carrega ou se não há sessão
  if (status === 'loading' || !session) return null

  const role = (session?.user as any)?.role ?? 'geral'
  const info = ROLE_LABELS[role] ?? ROLE_LABELS.geral

  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px',
      borderRadius: 999, letterSpacing: '0.05em',
      background: info.bg, color: info.color,
      border: `1px solid ${info.color}40`,
      whiteSpace: 'nowrap',
    }}>
      {info.label}
    </span>
  )
}
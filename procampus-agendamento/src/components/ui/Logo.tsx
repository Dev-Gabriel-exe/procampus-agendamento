// ============================================================
// ARQUIVO: src/components/ui/Logo.tsx
// CAMINHO: procampus-agendamento/src/components/ui/Logo.tsx
// SUBSTITUA o arquivo inteiro
// ============================================================

'use client'

import Image from 'next/image'

interface LogoProps {
  size?: number
  white?: boolean
  style?: React.CSSProperties
}

export default function Logo({ size = 40, white = true, style = {} }: LogoProps) {
  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <Image
        src="/logo.png"
        alt="Pro Campus"
        fill
        priority
        style={{
          objectFit: 'contain',
          filter: white ? 'brightness(0) invert(1)' : 'none',
          ...style,
        }}
      />
    </div>
  )
}
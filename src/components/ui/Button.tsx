// ============================================================
// ARQUIVO: src/components/ui/Button.tsx
// CAMINHO: procampus-agendamento/src/components/ui/Button.tsx
// SUBSTITUA o arquivo inteiro
// ============================================================

'use client'
import { motion } from 'framer-motion'
import { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'white' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  children,
  disabled,
  onClick,
  type = 'button',
  className = '',
  style: extraStyle = {},
  ...props
}: ButtonProps) {
  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '8px 16px',  fontSize: 13, borderRadius: 10, gap: 6 },
    md: { padding: '12px 24px', fontSize: 14, borderRadius: 12, gap: 8 },
    lg: { padding: '16px 32px', fontSize: 16, borderRadius: 14, gap: 10 },
  }

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, #23A455, #61CE70)',
      color: 'white', border: 'none',
      boxShadow: '0 4px 20px rgba(97,206,112,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
    },
    ghost: {
      background: 'rgba(255,255,255,0.08)',
      color: 'rgba(255,255,255,0.9)',
      border: '1px solid rgba(255,255,255,0.15)',
    },
    white: {
      background: 'white',
      color: '#0D2818',
      border: 'none',
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
    },
    danger: {
      background: 'linear-gradient(135deg, #dc2626, #ef4444)',
      color: 'white', border: 'none',
      boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
    },
    outline: {
      background: 'transparent',
      color: '#23A455',
      border: '1.5px solid rgba(97,206,112,0.4)',
    },
  }

  const isDisabled = disabled || loading

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.03, y: -1 } : {}}
      whileTap={!isDisabled ? { scale: 0.97 } : {}}
      style={{
        ...variants[variant],
        ...sizes[size],
        ...extraStyle,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'inherit',
        fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.55 : 1,
        transition: 'box-shadow 0.25s, opacity 0.25s',
        position: 'relative',
        overflow: 'hidden',
        gap: sizes[size].gap,
      }}
      className={className}
    >
      {loading && (
        <div style={{
          width: 14, height: 14, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.3)',
          borderTopColor: 'currentColor',
          animation: 'spin 0.7s linear infinite',
          flexShrink: 0,
        }} />
      )}
      {!loading && icon && <span style={{ display: 'flex', flexShrink: 0 }}>{icon}</span>}
      <span>{children}</span>
      {!loading && iconRight && <span style={{ display: 'flex', flexShrink: 0 }}>{iconRight}</span>}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.button>
  )
}
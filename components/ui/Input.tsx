// ============================================================
// ARQUIVO: src/components/ui/Input.tsx
// CAMINHO: components/ui/Input.tsx
'use client'
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, ReactNode, useRef } from 'react'

interface BaseProps {
  label?: string
  error?: string
  hint?: string
  icon?: ReactNode
  mask?: 'phone' | 'phone-br'
}

interface InputProps extends BaseProps, InputHTMLAttributes<HTMLInputElement> {
  multiline?: false
}

interface TextareaProps extends BaseProps, TextareaHTMLAttributes<HTMLTextAreaElement> {
  multiline: true
  rows?: number
}

type Props = InputProps | TextareaProps

const focusStyle = { borderColor: '#23A455', boxShadow: '0 0 0 4px rgba(97,206,112,0.12)' }
const blurStyle  = { borderColor: 'rgba(97,206,112,0.2)', boxShadow: 'none' }

// ── Máscaras ─────────────────────────────────────────────
// phone    → +55 (86) 99999-9999  (internacional, para professores)
// phone-br → (86) 99999-9999      (nacional, para pais/responsáveis)

function maskPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 13)
  if (d.length === 0)  return ''
  if (d.length <= 2)   return `+${d}`
  if (d.length <= 4)   return `+${d.slice(0,2)} (${d.slice(2)}`
  if (d.length <= 9)   return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4)}`
  return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,9)}-${d.slice(9)}`
}

function maskPhoneBr(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0)  return ''
  if (d.length <= 2)   return `(${d}`
  if (d.length <= 7)   return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 11)  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  return value
}

function applyMask(value: string, mask?: 'phone' | 'phone-br'): string {
  if (mask === 'phone')    return maskPhone(value)
  if (mask === 'phone-br') return maskPhoneBr(value)
  return value
}

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, Props>(
  (props, ref) => {
    const { label, error, hint, icon, mask, className = '' } = props
    const isMultiline = props.multiline === true

    const fieldStyle: React.CSSProperties = {
      width: '100%',
      padding: icon ? '13px 16px 13px 44px' : '13px 16px',
      borderRadius: 12,
      border: error ? '1.5px solid #ef4444' : '1.5px solid rgba(97,206,112,0.2)',
      background: 'white',
      fontSize: 14,
      color: '#0a1a0d',
      outline: 'none',
      transition: 'all 0.25s',
      fontFamily: 'inherit',
      resize: isMultiline ? 'vertical' : undefined,
    }

    const { multiline, label: _l, error: _e, hint: _h, icon: _i, mask: _m, ...domProps } = props as any

    // Intercepta onChange para aplicar máscara
    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      if (mask) {
        const masked = applyMask(e.target.value, mask)
        // Atualiza o valor do input visualmente
        e.target.value = masked
      }
      domProps.onChange?.(e)
    }

    return (
      <div style={{ width: '100%' }}>
        {label && (
          <label style={{
            display: 'block', fontSize: 13, fontWeight: 600,
            color: '#3d5c42', marginBottom: 8,
          }}>
            {label}
          </label>
        )}
        <div style={{ position: 'relative' }}>
          {icon && (
            <div style={{
              position: 'absolute', left: 14,
              top: isMultiline ? 14 : '50%',
              transform: isMultiline ? 'none' : 'translateY(-50%)',
              color: '#6b8f72', display: 'flex', pointerEvents: 'none', zIndex: 1,
            }}>
              {icon}
            </div>
          )}

          {isMultiline ? (
            <textarea
              ref={ref as any}
              {...domProps}
              rows={domProps.rows || 3}
              style={fieldStyle}
              className={className}
              onFocus={e => { Object.assign(e.target.style, focusStyle); domProps.onFocus?.(e) }}
              onBlur={e  => { Object.assign(e.target.style, error ? { borderColor: '#ef4444', boxShadow: 'none' } : blurStyle); domProps.onBlur?.(e) }}
            />
          ) : (
            <input
              ref={ref as any}
              {...domProps}
              style={fieldStyle}
              className={className}
              onChange={mask ? handleChange : domProps.onChange}
              onFocus={e => { Object.assign(e.target.style, focusStyle); domProps.onFocus?.(e) }}
              onBlur={e  => { Object.assign(e.target.style, error ? { borderColor: '#ef4444', boxShadow: 'none' } : blurStyle); domProps.onBlur?.(e) }}
            />
          )}
        </div>
        {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{error}</p>}
        {hint && !error && <p style={{ color: '#6b8f72', fontSize: 12, marginTop: 6 }}>{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
export default Input
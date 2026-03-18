// ============================================================
// ARQUIVO: src/components/ui/Input.tsx
// CAMINHO: procampus-agendamento/src/components/ui/Input.tsx
// ============================================================

'use client'
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, ReactNode } from 'react'

interface BaseProps {
  label?: string
  error?: string
  hint?: string
  icon?: ReactNode
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

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, Props>(
  (props, ref) => {
    const { label, error, hint, icon, className = '' } = props
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

    // Remove props customizadas que não pertencem ao DOM
    const { multiline, label: _l, error: _e, hint: _h, icon: _i, ...domProps } = props as any

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
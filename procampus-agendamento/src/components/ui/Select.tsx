'use client'
import { SelectHTMLAttributes, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  icon?: ReactNode
  options: { value: string; label: string }[]
  placeholder?: string
}

export default function Select({
  label, error, icon, options, placeholder = 'Selecione...', className = '', ...props
}: SelectProps) {
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
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: '#6b8f72', display: 'flex', pointerEvents: 'none', zIndex: 1,
          }}>
            {icon}
          </div>
        )}
        <select
          style={{
            width: '100%',
            padding: icon ? '13px 44px 13px 44px' : '13px 44px 13px 16px',
            borderRadius: 12,
            border: error ? '1.5px solid #ef4444' : '1.5px solid rgba(97,206,112,0.2)',
            background: 'white', fontSize: 14, color: '#0a1a0d',
            outline: 'none', appearance: 'none', cursor: 'pointer',
            transition: 'all 0.25s', fontFamily: 'inherit',
          }}
          className={className}
          {...props}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown style={{
          position: 'absolute', right: 14, top: '50%',
          transform: 'translateY(-50%)', width: 16, height: 16,
          color: '#6b8f72', pointerEvents: 'none',
        }} />
      </div>
      {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{error}</p>}
    </div>
  )
}

Select.displayName = 'Select';

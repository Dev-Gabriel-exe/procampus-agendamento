'use client'

export default function LoadingSpinner({
  size = 40, color = '#23A455', fullscreen = false,
}: {
  size?: number; color?: string; fullscreen?: boolean
}) {
  const spinner = (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `${size * 0.1}px solid rgba(97,206,112,0.15)`,
      borderTopColor: color,
      animation: 'spin 0.75s linear infinite',
    }} />
  )

  if (fullscreen) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(240,250,242,0.85)', backdropFilter: 'blur(4px)',
      }}>
        {spinner}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      {spinner}
    </div>
  )
}

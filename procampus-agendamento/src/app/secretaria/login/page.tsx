// ============================================================
// ARQUIVO: src/app/secretaria/login/page.tsx
// CAMINHO: procampus-agendamento/src/app/secretaria/login/page.tsx
// SUBSTITUA o arquivo inteiro
// ============================================================

'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, User, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react'

interface Particle {
  id: number; x: string; y: string
  size: number; color: string; dur: number; delay: number; yAmt: number
}

function Particles() {
  const [list, setList] = useState<Particle[]>([])
  useEffect(() => {
    setList(Array.from({ length: 16 }, (_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      y: `${Math.random() * 100}%`,
      size: Math.random() * 5 + 2,
      color: i % 3 === 0
        ? 'rgba(110,193,228,0.45)'
        : i % 3 === 1
        ? 'rgba(64,84,178,0.3)'
        : 'rgba(255,255,255,0.18)',
      dur: Math.random() * 5 + 4,
      delay: Math.random() * 5,
      yAmt: Math.random() * 28 + 12,
    })))
  }, [])
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {list.map(p => (
        <motion.div key={p.id}
          style={{ position: 'absolute', borderRadius: '50%', width: p.size, height: p.size, left: p.x, top: p.y, background: p.color }}
          animate={{ y: [0, -p.yAmt, 0], opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

export default function LoginPage() {
  const router   = useRouter()
  const [username,     setUsername]     = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn('credentials', { username, password, redirect: false })
    setLoading(false)
    if (result?.error) setError('Usuário ou senha incorretos.')
    else router.push('/secretaria')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(160deg, #071410 0%, #0D2818 30%, #133d20 60%, #1a5428 100%)',
      backgroundSize: '400% 400%',
      animation: 'heroShift 18s ease infinite',
    }}>

      {/* Orbs de fundo */}
      <div style={{
        position: 'absolute', top: '-15%', right: '-10%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(110,193,228,0.15), transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-15%', left: '-10%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(64,84,178,0.12), transparent 70%)',
        filter: 'blur(50px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '40%', left: '20%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(97,206,112,0.08), transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      <Particles />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 10 }}
      >
        <div style={{
          background: 'white',
          borderRadius: 28,
          overflow: 'hidden',
          boxShadow: '0 32px 100px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
        }}>

          {/* Header do card */}
          <div style={{
            padding: '36px 36px 28px',
            background: 'linear-gradient(160deg, #0D2818 0%, #1a7a2e 60%, #23A455 100%)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Linhas decorativas */}
            <div style={{
              position: 'absolute', top: 0, left: '30%', width: 1, height: '100%',
              background: 'linear-gradient(180deg, transparent, rgba(97,206,112,0.2), transparent)',
              transform: 'rotate(8deg)',
            }} />
            <div style={{
              position: 'absolute', top: 0, right: '25%', width: 1, height: '100%',
              background: 'linear-gradient(180deg, transparent, rgba(110,193,228,0.1), transparent)',
              transform: 'rotate(-5deg)',
            }} />

            {/* Logo animado */}
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ margin: '0 auto 18px', width: 'fit-content', position: 'relative', zIndex: 1 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Pro Campus"
                style={{ width: 72, height: 72, objectFit: 'contain', display: 'block' }}
              />
            </motion.div>

            <h1 style={{
              fontFamily: 'var(--font-display), "Roboto Slab", serif',
              fontWeight: 900, fontSize: 26, color: 'white',
              lineHeight: 1, letterSpacing: '-0.5px',
              position: 'relative', zIndex: 1,
            }}>
              Pro Campus
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 6,
              position: 'relative', zIndex: 1,
            }}>
              Área Restrita — Secretaria
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} style={{ padding: '32px 36px 36px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Campo usuário */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3d5c42', marginBottom: 8 }}>
                Usuário
              </label>
              <div style={{ position: 'relative' }}>
                <User style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  width: 16, height: 16, color: '#6b8f72', pointerEvents: 'none',
                }} />
                <input
                  type="text" value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin" required
                  style={{
                    width: '100%', paddingLeft: 44, paddingRight: 16,
                    paddingTop: 14, paddingBottom: 14,
                    borderRadius: 14, border: '1.5px solid rgba(97,206,112,0.2)',
                    background: 'white', fontSize: 14, outline: 'none',
                    fontFamily: 'inherit', color: '#0a1a0d', transition: 'all 0.25s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#23A455'; e.target.style.boxShadow = '0 0 0 4px rgba(97,206,112,0.12)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>

            {/* Campo senha */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3d5c42', marginBottom: 8 }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  width: 16, height: 16, color: '#6b8f72', pointerEvents: 'none',
                }} />
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  style={{
                    width: '100%', paddingLeft: 44, paddingRight: 48,
                    paddingTop: 14, paddingBottom: 14,
                    borderRadius: 14, border: '1.5px solid rgba(97,206,112,0.2)',
                    background: 'white', fontSize: 14, outline: 'none',
                    fontFamily: 'inherit', color: '#0a1a0d', transition: 'all 0.25s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#23A455'; e.target.style.boxShadow = '0 0 0 4px rgba(97,206,112,0.12)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(97,206,112,0.2)'; e.target.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#6b8f72', display: 'flex', padding: 4,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#23A455'}
                  onMouseLeave={e => e.currentTarget.style.color = '#6b8f72'}
                >
                  {showPassword
                    ? <EyeOff style={{ width: 16, height: 16 }} />
                    : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: '#fef2f2', border: '1px solid rgba(239,68,68,0.25)',
                  color: '#dc2626', padding: '12px 16px', borderRadius: 12, fontSize: 13,
                }}
              >
                <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
                {error}
              </motion.div>
            )}

            {/* Botão entrar */}
            <motion.button
              type="submit" disabled={loading}
              whileHover={!loading ? { scale: 1.02, y: -1 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              style={{
                width: '100%', padding: '15px 24px',
                borderRadius: 14, border: 'none',
                background: loading ? '#c3e6cb' : 'linear-gradient(135deg, #1a7a2e, #23A455, #61CE70)',
                color: 'white', fontSize: 15, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: loading ? 'none' : '0 6px 24px rgba(97,206,112,0.45)',
                transition: 'all 0.3s',
                fontFamily: 'inherit',
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Entrando...
                </>
              ) : (
                <>
                  <Lock style={{ width: 16, height: 16 }} />
                  Entrar na Secretaria
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </>
              )}
            </motion.button>

            {/* Rodapé do form */}
            <p style={{ textAlign: 'center', color: '#6b8f72', fontSize: 12, marginTop: 4 }}>
              Acesso exclusivo para colaboradores do Pro Campus
            </p>
          </form>
        </div>

        {/* Link voltar */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/" style={{
            color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: 500,
            textDecoration: 'none', transition: 'color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
          >
            ← Voltar para o início
          </a>
        </div>
      </motion.div>

      <style>{`
        @keyframes heroShift {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
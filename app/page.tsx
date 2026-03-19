// ============================================================
// ARQUIVO: app/page.tsx
// CAMINHO: app/page.tsx
// ============================================================

import Navbar          from '@/components/home/Navbar'
import HeroSection     from '@/components/home/HeroSection'
import HowItWorks      from '@/components/home/HowItWorks'
import FeaturesSection from '@/components/home/FeaturesSection'
import CTASection      from '@/components/home/CTASection'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <FeaturesSection />
      <CTASection />

      {/* Footer */}
      <footer style={{
        padding: '48px 24px',
        background: '#071410',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Pro Campus"
            style={{ width: 36, height: 36, objectFit: 'contain', display: 'block' }} />
          <span style={{
            fontFamily: 'var(--font-display),"Roboto Slab",serif',
            fontWeight: 800, color: 'white', fontSize: 16,
          }}>
            Pro Campus
          </span>
        </div>

        {/* Linha divisória */}
        <div style={{
          height: 1, maxWidth: 200, margin: '0 auto 16px',
          background: 'linear-gradient(90deg,transparent,rgba(97,206,112,0.3),transparent)',
        }} />

        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
          © {new Date().getFullYear()} Grupo Educacional Pro Campus — Teresina, Piauí
        </p>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 4 }}>
          Sistema de Plantão Escolar - Desenvolvido por Ucode
        </p>
      </footer>
    </>
  )
}
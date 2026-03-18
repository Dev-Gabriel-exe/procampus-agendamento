// ============================================================
// ARQUIVO: src/app/layout.tsx
// CAMINHO: procampus-agendamento/src/app/layout.tsx

// ============================================================

import type { Metadata } from 'next'
import { Roboto_Slab, DM_Sans } from 'next/font/google'
import './globals.css'

// Display font — títulos premium
const robotoSlab = Roboto_Slab({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
})

// Body font — DM Sans, mais elegante que Roboto puro
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Pro Campus — Agendamento de Reuniões',
  description: 'Agende reuniões pedagógicas com os professores do Grupo Educacional Pro Campus.',
  keywords: 'Pro Campus, agendamento pedagógico, reunião, escola, Teresina, Piauí',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${robotoSlab.variable} ${dmSans.variable}`}>
      <body className={dmSans.className}>
        {children}
      </body>
    </html>
  )
}
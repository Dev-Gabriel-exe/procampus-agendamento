import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand:           '#61CE70',
        'brand-dark':    '#23A455',
        'brand-darker':  '#1a7a2e',
        'brand-deep':    '#0D2818',
        'brand-light':   '#e8f9eb',
        'brand-soft':    '#f0faf2',
        accent:          '#6EC1E4',
        'accent-dark':   '#4054B2',
        'text-dark':     '#0a1a0d',
        'text-mid':      '#3d5c42',
        'text-soft':     '#6b8f72',
      },
      fontFamily: {
        display: ['var(--font-display)', '"Roboto Slab"', 'serif'],
        body:    ['var(--font-body)', '"DM Sans"', 'sans-serif'],
        sans:    ['var(--font-body)', '"DM Sans"', 'sans-serif'],
      },
      boxShadow: {
        'brand':    '0 4px 24px rgba(97,206,112,0.35)',
        'brand-lg': '0 8px 48px rgba(97,206,112,0.45)',
        'brand-xl': '0 16px 64px rgba(97,206,112,0.4)',
        'deep':     '0 24px 80px rgba(0,0,0,0.4)',
        'card':     '0 2px 20px rgba(0,0,0,0.06)',
      },
      backgroundImage: {
        'hero': 'linear-gradient(160deg,#071410 0%,#0D2818 25%,#133d20 55%,#1a5428 80%,#0D2818 100%)',
        'brand-gradient': 'linear-gradient(135deg,#23A455,#61CE70)',
        'brand-gradient-v': 'linear-gradient(180deg,#23A455,#61CE70)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
}
export default config
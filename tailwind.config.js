/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Preto fosco / grafite
        ink: {
          50: '#f4f4f6',
          100: '#e6e6ea',
          200: '#c9c9d2',
          300: '#a0a0ad',
          950: '#08080a',
          900: '#0c0c0f',
          850: '#101015',
          800: '#15151b',
          700: '#1d1d25',
          600: '#272732',
          500: '#34343f',
          400: '#4a4a57',
        },
        // Dourado escuro
        gold: {
          50: '#fbf5e4',
          100: '#f3e3b8',
          200: '#e7cc83',
          300: '#d9b256',
          400: '#c79a3a',
          500: '#b8943f',
          600: '#9a7a2e',
          700: '#766019',
          800: '#544514',
        },
        // Fases RUGIDO
        fase: {
          raiox: '#5b8def',
          ultra: '#8b5cf6',
          gameplan: '#ec4899',
          impl: '#f59e0b',
          demanda: '#10b981',
          escala: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(184,148,63,0.25), 0 8px 30px -8px rgba(184,148,63,0.35)',
        panel: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 50px -20px rgba(0,0,0,0.8)',
      },
      backgroundImage: {
        'gold-grad': 'linear-gradient(135deg, #e7cc83 0%, #b8943f 45%, #766019 100%)',
        'ink-grad': 'linear-gradient(160deg, #15151b 0%, #0c0c0f 100%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores personalizadas tema escuro e RPG
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          500: '#8b5cf6', // Roxo principal
          600: '#7c3aed',
          700: '#6d28d9',
          900: '#4c1d95',
        },
        game: {
          gold: '#fbbf24',    // Moedas / XP
          success: '#10b981', // Verde acerto
          danger: '#ef4444',  // Vermelho erro / Boss dano
          dark: '#0f172a',    // Fundo escuro slate-900
          darker: '#020617',  // Fundo slate-950
          card: '#1e293b',    // Fundo cards slate-800
          border: '#334155',  // Borda slate-700
        }
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.5s ease-in-out',
        'flame': 'flame 1.5s ease-in-out infinite alternate',
        'level-up': 'levelUp 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
        flame: {
          '0%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 2px #f97316)' },
          '100%': { transform: 'scale(1.1)', filter: 'drop-shadow(0 0 10px #ef4444)' },
        },
        levelUp: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.1)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}

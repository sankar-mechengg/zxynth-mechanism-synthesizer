/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* Blueprint engineering palette */
        blueprint: {
          50: '#e8f0fe',
          100: '#c5d9f9',
          200: '#9ebef3',
          300: '#739fed',
          400: '#5287e8',
          500: '#3170e3',
          600: '#2a60c8',
          700: '#1e4da8',
          800: '#163b88',
          900: '#0d2a6b',
          950: '#081a47',
        },
        /* Dark mode surface colors */
        surface: {
          900: '#0a0e1a',    /* Deepest background */
          800: '#0f1525',    /* Card background */
          700: '#151d33',    /* Elevated surface */
          600: '#1c2640',    /* Input/panel background */
          500: '#243050',    /* Border/separator */
        },
        /* Accent colors for mechanism elements */
        mechanism: {
          link: '#60a5fa',       /* Link color - blue */
          joint: '#f59e0b',      /* Joint color - amber */
          coupler: '#34d399',    /* Coupler curve - emerald */
          desired: '#f472b6',    /* Desired path - pink */
          error: '#ef4444',      /* Error shading - red */
          ground: '#94a3b8',     /* Ground link - slate */
        },
        /* Grid line colors */
        grid: {
          major: 'rgba(49, 112, 227, 0.15)',
          minor: 'rgba(49, 112, 227, 0.06)',
          'major-light': 'rgba(30, 77, 168, 0.12)',
          'minor-light': 'rgba(30, 77, 168, 0.05)',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"SF Pro Display"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(49, 112, 227, 0.3)',
        'glow-emerald': '0 0 20px rgba(52, 211, 153, 0.3)',
        'inner-blueprint': 'inset 0 1px 4px rgba(49, 112, 227, 0.1)',
      },
      backgroundImage: {
        'blueprint-grid': `
          linear-gradient(rgba(49, 112, 227, 0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(49, 112, 227, 0.06) 1px, transparent 1px),
          linear-gradient(rgba(49, 112, 227, 0.15) 1px, transparent 1px),
          linear-gradient(90deg, rgba(49, 112, 227, 0.15) 1px, transparent 1px)
        `,
        'blueprint-grid-light': `
          linear-gradient(rgba(30, 77, 168, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(30, 77, 168, 0.05) 1px, transparent 1px),
          linear-gradient(rgba(30, 77, 168, 0.12) 1px, transparent 1px),
          linear-gradient(90deg, rgba(30, 77, 168, 0.12) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'blueprint-grid': '20px 20px, 20px 20px, 100px 100px, 100px 100px',
      },
    },
  },
  plugins: [],
};

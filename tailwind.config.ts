import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: '#1C1D1F',
        surface: '#232427',
        elevated: '#292A2E',
        border: '#34363A',
        'text-primary': '#F5F5F4',
        'text-secondary': '#A6A7AB',
        'text-muted': '#6F7177',
        primary: {
          DEFAULT: '#FF6B1A',
          hover: '#FF7A32',
          muted: '#3D281C',
        },
        status: {
          waiting: { bg: '#3A2D18', border: '#6B4D1C', text: '#F2B84B' },
          progress: { bg: '#182B3A', border: '#28516A', text: '#70B7E8' },
          blocked: { bg: '#3A2418', border: '#75421F', text: '#F29A4A' },
          done: { bg: '#17352A', border: '#245A43', text: '#6FD6A2' },
        },
      },
      fontFamily: {
        heading: ['var(--font-manrope)', 'sans-serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-ibm-plex-mono)', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    },
  },
  plugins: [],
};

export default config;

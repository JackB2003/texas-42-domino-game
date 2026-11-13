import type { Config } from 'tailwindcss';

/** Design tokens lifted from design/README.md (authoritative). */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        felt: {
          base: '#16352b',
          mid: '#2c6450',
          deep: '#1c4538',
          dark: '#0e2620',
        },
        hud: {
          top: '#0d1a15',
          bottom: '#070f0b',
        },
        modal: {
          top: '#241910',
          bottom: '#170f08',
        },
        us: {
          DEFAULT: '#3D6FB4',
          light: '#5A89CE',
          accent: '#79A6E2',
          pale: '#AECBEE',
          deep: '#234A82',
        },
        them: {
          DEFAULT: '#BF8F2A',
          light: '#D4A235',
          pale: '#E6C566',
        },
        logo: {
          red: '#C0392B',
          coral: '#E05B4D',
        },
        verdict: {
          made: '#46C97E',
          set: '#FF6A5E',
        },
        trump: '#F5A623',
        parchment: {
          100: '#e8d9bf',
          200: '#cdbfa8',
          300: '#9a8a72',
          400: '#6b5d49',
          accent: '#E8a06a',
        },
        pip: {
          1: '#3FA0E0',
          2: '#2E8B57',
          3: '#CB3B33',
          4: '#8A5A2B',
          5: '#1E3A8A',
          6: '#E0A800',
        },
      },
      fontFamily: {
        sans: ['Libre Franklin', 'system-ui', 'sans-serif'],
        display: ['Rye', 'serif'],
      },
      backgroundImage: {
        felt: 'radial-gradient(ellipse 85% 75% at 50% 36%, #2c6450 0%, #1c4538 48%, #0e2620 100%)',
        hud: 'linear-gradient(180deg, #0d1a15, #070f0b)',
        modal: 'linear-gradient(180deg, #241910, #170f08)',
      },
      transitionDuration: {
        snap: '100ms',
        quick: '200ms',
        normal: '350ms',
        slow: '500ms',
        scene: '800ms',
        breath: '1200ms',
      },
    },
  },
  plugins: [],
} satisfies Config;

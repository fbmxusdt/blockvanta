/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#010A18',
          900: '#030E21',
          850: '#06142C',
          800: '#0A1C3A',
          700: '#112345',
          600: '#1A3060',
        },
        gold: {
          200: '#EDDA96',
          300: '#D9B84A',
          400: '#C8960C',
          500: '#A87A08',
          600: '#7A5605',
        },
        ivory: '#EEE5CC',
        steel: '#5A7499',
        'slate-muted': '#3F5878',
        emerald: { DEFAULT: '#2DBF8A' },
        danger: '#C84040',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
      },
      backgroundImage: {
        'grid-navy': `linear-gradient(rgba(200,150,12,.022) 1px,transparent 1px),
                      linear-gradient(90deg,rgba(200,150,12,.022) 1px,transparent 1px)`,
      },
      backgroundSize: {
        'grid': '48px 48px',
      },
    },
  },
  plugins: [],
}

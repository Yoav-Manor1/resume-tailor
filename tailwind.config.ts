import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgb(0 0 0 / 0.04), 0 4px 12px rgb(0 0 0 / 0.04)',
        ring: '0 0 0 1px rgb(0 0 0 / 0.06)',
      },
      colors: {
        accent: {
          DEFAULT: 'rgb(79 70 229)',
          fg: 'rgb(255 255 255)',
          hover: 'rgb(67 56 202)',
        },
      },
      letterSpacing: {
        tightish: '-0.015em',
      },
    },
  },
  plugins: [],
}
export default config

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#111111',
          light: '#FFFFFF',
          sand: '#F5F5F0',
          accent: '#8B0000',
          gold: '#C9A66B',
          gray: '#767676',
          border: '#E5E5E5'
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        script: ['"Parfumerie Script Text"', '"Parfumerie Script"', 'Pinyon Script', 'Alex Brush', 'cursive'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      letterSpacing: {
        'super-wide': '0.25em',
        'ultra-wide': '0.35em',
      },
      aspectRatio: {
        'portrait': '3 / 4',
        'editorial': '4 / 5',
        'tall': '9 / 16',
      },
      boxShadow: {
        'editorial': '0 20px 40px -15px rgba(0, 0, 0, 0.08)',
        'dropdown': '0 10px 30px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}

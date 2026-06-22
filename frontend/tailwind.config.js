/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FBF8F2",
          100: "#F5EFE3",
          200: "#EBE1CC",
          300: "#DCCEB0",
        },
        sage: {
          400: "#7A8B6E",
          500: "#5E7052",
          600: "#465A3D",
          700: "#33442D",
          900: "#1A2417",
        },
        stone: {
          850: "#2A2A28",
          950: "#0E0E0D",
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Outfit"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        wider2: '0.18em',
        wider3: '0.28em',
      },
      animation: {
        'fade-up': 'fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in': 'fadeIn 1.2s ease-out both',
        'marquee': 'marquee 40s linear infinite',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(28px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
    },
  },
  plugins: [],
};

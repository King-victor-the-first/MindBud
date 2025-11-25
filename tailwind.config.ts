import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        body: ['PT Sans', 'sans-serif'],
        headline: ['Playfair Display', 'serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      transitionDuration: {
        '6000': '6000ms',
        '8000': '8000ms',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'siri-1': {
            '0%, 100%': { transform: 'scaleY(0.2)' },
            '50%': { transform: 'scaleY(1)' },
        },
        'siri-2': {
            '0%, 100%': { transform: 'scaleY(0.5)' },
            '50%': { transform: 'scaleY(1)' },
        },
        'siri-3': {
            '0%, 100%': { transform: 'scaleY(0.8)' },
            '50%': { transform: 'scaleY(0.2)' },
        },
        'spin-continuous': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 15px hsl(var(--primary) / 0.4)',
          },
          '50%': {
            boxShadow: '0 0 25px 5px hsl(var(--primary) / 0.6)',
          },
        },
        'jiggle': {
          '0%, 100%': { transform: 'rotate(0deg) translateX(-50%)' },
          '25%': { transform: 'rotate(-5deg) translateX(-50%)' },
          '75%': { transform: 'rotate(5deg) translateX(-50%)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'siri-1': 'siri-1 1s ease-in-out infinite',
        'siri-2': 'siri-2 1s ease-in-out infinite 0.2s',
        'siri-3': 'siri-3 1s ease-in-out infinite 0.4s',
        'spin-continuous': 'spin-continuous .5s linear infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'jiggle': 'jiggle 0.3s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

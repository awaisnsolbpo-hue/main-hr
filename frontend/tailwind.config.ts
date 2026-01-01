/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      // Mobile-first breakpoints
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      // Touch-friendly spacing
      spacing: {
        'touch': '44px', // Minimum touch target size
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      // Larger tap targets for mobile
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
      // Material Dashboard box shadows
      boxShadow: {
        'md-xs': '0 2px 9px -5px rgba(0, 0, 0, 0.15)',
        'md-sm': '0 4px 12px -4px rgba(0, 0, 0, 0.15)',
        'md': '0 4px 20px -4px rgba(0, 0, 0, 0.15)',
        'md-lg': '0 8px 26px -4px rgba(0, 0, 0, 0.15)',
        'md-xl': '0 20px 27px -8px rgba(0, 0, 0, 0.15)',
        'md-xxl': '0 23px 45px -11px rgba(0, 0, 0, 0.25)',
        // Colored shadows for Material Dashboard
        'pink': '0 4px 20px -2px rgba(233, 30, 99, 0.4)',
        'blue': '0 4px 20px -2px rgba(26, 115, 232, 0.4)',
        'green': '0 4px 20px -2px rgba(76, 175, 80, 0.4)',
        'orange': '0 4px 20px -2px rgba(251, 140, 0, 0.4)',
        'red': '0 4px 20px -2px rgba(244, 67, 53, 0.4)',
        'dark': '0 4px 20px -2px rgba(52, 71, 103, 0.4)',
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
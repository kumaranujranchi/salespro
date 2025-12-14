/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '.dark-theme'],
  theme: {
    extend: {
      colors: {
        "primary": "#13ec6a",
        "background-light": "#f6f8f7",
        "background-dark": "#0e1a15",
        "surface-dark": "#182620", 
        "surface-highlight": "#28392f",
        "text-muted": "#9db9a8",
        "surface-light": "#ffffff",
      },
      fontFamily: {
        "display": ["Spline Sans", "sans-serif"]
      },
      screens: {
        // Default Tailwind breakpoints (preserved)
        // 'sm': '640px',
        // 'md': '768px',
        // 'lg': '1024px',
        // 'xl': '1280px',
        // '2xl': '1536px',

        // Custom tablet breakpoints
        'tablet': '768px',           // Tablet portrait start
        'tablet-lg': '1024px',       // Tablet landscape / small desktop
        'tablet-only': { 'min': '768px', 'max': '1023px' }, // Tablet only
        'mobile-only': { 'max': '767px' },  // Mobile only
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(145deg, rgba(40, 57, 47, 0.5) 0%, rgba(20, 30, 25, 0.4) 100%)',
        'glow-gradient': 'radial-gradient(circle at center, rgba(19, 236, 106, 0.15) 0%, transparent 70%)',
      }
    },
  },
  plugins: [],
};

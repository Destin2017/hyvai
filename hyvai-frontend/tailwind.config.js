/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],

  theme: {
    extend: {
      animation: {
        heartbeat: 'heartbeat 1.6s infinite ease-in-out',
      },
      keyframes: {
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.3)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.2)' },
          '70%': { transform: 'scale(1)' },
        }
      }
    },
  },
};

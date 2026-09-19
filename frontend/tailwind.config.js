/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "iron-navy": "#17324D",
        "iron-navy-deep": "#101A22",
        "iron-blue": "#245B73",
        "iron-teal": "#2A7F8E",
        "iron-healthy": "#2E7D5B",
        "iron-warning": "#D69E2E",
        "iron-critical": "#C94A4A",
        "iron-bg": "#F5F7F8",
        "iron-border": "#D9E0E5",
      },
    },
  },
  plugins: [],
};

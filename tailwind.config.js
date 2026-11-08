/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // AnonTrove Warm Editorial Bookstore Palette
        paper: {
          50: "#FCFBF9",
          100: "#F7F5F0",
          200: "#EFECE4",
          300: "#E5E1D5",
        },
        charcoal: {
          50: "#F5F5F4",
          100: "#E7E5E4",
          300: "#A8A29E",
          700: "#44403C",
          800: "#292524",
          900: "#1C1917",
          950: "#0C0A09",
        },
        bronze: {
          50: "#FAF6F1",
          100: "#F2E8DC",
          500: "#9A704B",
          600: "#835C3A",
          700: "#6B492B",
          800: "#54371E",
        },
        stone: {
          muted: "#81796D",
          light: "#A49D92",
          dark: "#5B5449",
        },
        divider: "#E8E4DC",
        surface: "#FFFFFF",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "Lora", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        'book': '0 4px 6px -1px rgba(36, 35, 31, 0.08), 0 2px 4px -2px rgba(36, 35, 31, 0.06)',
        'book-hover': '0 12px 24px -4px rgba(36, 35, 31, 0.12), 0 4px 8px -2px rgba(36, 35, 31, 0.08)',
        'elevated': '0 20px 25px -5px rgba(36, 35, 31, 0.08), 0 8px 10px -6px rgba(36, 35, 31, 0.04)',
      },
    },
  },
  plugins: [],
};

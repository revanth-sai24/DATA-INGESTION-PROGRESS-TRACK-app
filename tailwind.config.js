/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },

      /* One accent, desaturated so it sits with the neutrals instead of
         shouting over them. Everything else is a single (cool) gray family. */
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#bcd3ff",
          300: "#8eb6ff",
          400: "#598eff",
          500: "#3b6fe0",
          DEFAULT: "#3b6fe0",
          600: "#2f57b8",
          700: "#284794",
          800: "#243c78",
          900: "#22365f",
        },
      },

      /* Shadows tinted with the surface hue rather than pure black — black at
         low opacity reads as grime, a tinted shadow reads as depth. */
      boxShadow: {
        xs: "0 1px 2px 0 rgba(23, 32, 51, 0.04)",
        sm: "0 1px 3px 0 rgba(23, 32, 51, 0.06), 0 1px 2px -1px rgba(23, 32, 51, 0.04)",
        DEFAULT:
          "0 2px 4px -1px rgba(23, 32, 51, 0.05), 0 4px 12px -2px rgba(23, 32, 51, 0.06)",
        md: "0 4px 8px -2px rgba(23, 32, 51, 0.06), 0 8px 20px -4px rgba(23, 32, 51, 0.08)",
        lg: "0 8px 16px -4px rgba(23, 32, 51, 0.08), 0 16px 32px -8px rgba(23, 32, 51, 0.10)",
        soft: "0 1px 3px 0 rgba(23, 32, 51, 0.06), 0 1px 2px -1px rgba(23, 32, 51, 0.04)",
      },

      borderRadius: {
        lg: "0.625rem",
        xl: "0.875rem",
        "2xl": "1.125rem",
      },

      /* A named scale, so no component has to invent z-[9999] again. */
      zIndex: {
        base: "0",
        raised: "10",
        sticky: "20",
        drawer: "30",
        overlay: "40",
        modal: "50",
        popover: "60",
        toast: "70",
      },

      transitionTimingFunction: {
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

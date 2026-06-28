import type { Config } from "tailwindcss";

// Premium purple theme, dark/light via CSS variables (see globals.css).
// Color tokens are `rgb(var(--x) / <alpha-value>)` so opacity utilities
// (e.g. `text-ink/55`, `bg-ink/[0.04]`) resolve correctly in both themes.
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        panel2: "rgb(var(--panel2) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)", // primary text (theme-aware)
        line: "rgb(var(--line) / <alpha-value>)", // hairline borders
        brand: "rgb(var(--brand) / <alpha-value>)", // premium purple
        navy: "rgb(var(--brand) / <alpha-value>)", // legacy alias → purple
        accent: "rgb(var(--accent) / <alpha-value>)", // lighter purple / links
        // contestant identity marks (stable across themes)
        c1: "#10B981", // emerald
        c2: "#F59E0B", // amber
        c3: "#EC4899", // pink
        c4: "#8B5CF6", // violet
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "var(--shadow-card)",
        glow: "var(--shadow-glow)",
      },
    },
  },
  plugins: [],
};

export default config;

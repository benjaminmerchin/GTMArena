import type { Config } from "tailwindcss";

// Modern dark theme. Coral stays the single dominant accent; the four warms are
// brightened for legibility on black and used only as contestant identity marks.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#08090B",
        ink: "#ECEDF0",
        coral: "#FF6F61",
        magenta: "#F2589B",
        chartreuse: "#DCE34F",
        terracotta: "#E2895F",
        mustard: "#FACF39",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "ui-sans-serif", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 36px -10px rgba(255,111,97,0.55)",
        "glow-sm": "0 0 0 1px rgba(255,111,97,0.25), 0 8px 30px -12px rgba(255,111,97,0.45)",
      },
    },
  },
  plugins: [],
};

export default config;

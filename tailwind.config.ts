import type { Config } from "tailwindcss";

// Clean navy-on-white theme (arena.ai / designarena.ai inspired).
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FFFFFF",
        ink: "#0B1F3A", // deep navy — primary text & headings
        navy: "#0A2540", // brand / primary buttons
        accent: "#2F6FED", // interactive blue
        line: "#E6EAF1", // hairline borders
        // contestant identity marks — distinct on white, away from the navy brand
        c1: "#0CA678", // teal
        c2: "#F59F00", // amber
        c3: "#E64980", // pink
        c4: "#7048E8", // violet
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "ui-serif", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px #0b1f3a0a, 0 10px 30px -14px #0b1f3a1f",
        "card-hover": "0 2px 6px #0b1f3a12, 0 16px 40px -16px #0b1f3a2b",
        navy: "0 8px 24px -10px #0a254066",
      },
    },
  },
  plugins: [],
};

export default config;

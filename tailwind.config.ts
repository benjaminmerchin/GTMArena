import type { Config } from "tailwindcss";

// Dark navy theme.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0A0F1C",
        panel: "#0E1626",
        ink: "#E7ECF5", // primary text (light)
        navy: "#2F6FED", // primary buttons / active (blue, pops on dark)
        accent: "#6AA0FF", // links / highlights
        line: "#1E2A3D", // hairline borders
        // contestant identity marks (brightened for dark)
        c1: "#2DD4BF", // teal
        c2: "#FBBF24", // amber
        c3: "#F472B6", // pink
        c4: "#A78BFA", // violet
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "ui-serif", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px #00000040, 0 14px 34px -16px #00000080",
        glow: "0 8px 30px -10px rgba(47,111,237,0.5)",
      },
    },
  },
  plugins: [],
};

export default config;

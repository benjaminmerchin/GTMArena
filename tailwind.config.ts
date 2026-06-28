import type { Config } from "tailwindcss";

// Kernel palette: coral is the one dominant accent; the four warms are used
// ONLY as contestant identity + chart marks, never as decoration.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FAFAFA",
        ink: "#1A1A1A",
        coral: "#FF6F61",
        magenta: "#C2185B",
        chartreuse: "#D4C545",
        terracotta: "#C77B57",
        mustard: "#FACF39",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        card: "#161616",
        "card-alt": "#1a1a1a",
        accent: "#4F6EF7",
        "accent-hover": "#3d5ce0",
        border: "#2a2a2a",
        muted: "#6b7280",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

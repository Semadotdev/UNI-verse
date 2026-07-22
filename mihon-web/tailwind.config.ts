import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#09090b",
          raised: "#111118",
          overlay: "#1a1a24",
        },
        border: {
          DEFAULT: "#27272a",
          hover: "#3f3f46",
        },
        primary: {
          DEFAULT: "#7C3AED",
          hover: "#6D28D9",
          light: "#A78BFA",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#A78BFA",
          hover: "#8B5CF6",
        },
        muted: {
          DEFAULT: "#71717a",
          foreground: "#3f3f46",
        },
        status: {
          ongoing: "#34d399",
          completed: "#60a5fa",
          cancelled: "#f87171",
          hiatus: "#fbbf24",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "card": "0 2px 8px rgba(0, 0, 0, 0.4)",
        "card-hover": "0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(124, 58, 237, 0.2)",
        "glow": "0 0 24px rgba(124, 58, 237, 0.25)",
        "glow-lg": "0 0 48px rgba(124, 58, 237, 0.35)",
        "glow-sm": "0 0 12px rgba(124, 58, 237, 0.2)",
        "moon": "0 0 30px rgba(167, 139, 250, 0.15)",
      },
      borderRadius: {
        "xl": "0.75rem",
        "2xl": "1rem",
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out forwards",
        "fade-in-up": "fade-in-up 0.4s ease-out forwards",
        "slide-in-right": "slide-in-right 0.3s ease-out forwards",
        "scale-in": "scale-in 0.2s ease-out forwards",
        "shimmer": "shimmer 2s linear infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 24px rgba(124, 58, 237, 0.25)" },
          "50%": { boxShadow: "0 0 40px rgba(124, 58, 237, 0.45)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

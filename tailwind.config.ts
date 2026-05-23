import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#03030a",
        abyss: "#06081a",
        navy: "#0a1030",
        plasma: "#a855f7",     // cosmic purple
        electric: "#38bdf8",   // electric blue
        cobalt: "#3b6dff",
        glow: "#f4f7ff",       // white glow
        gold: "#e8c372",       // subtle gold
        ember: "#ff4d6d",      // entropy red
        ash: "#8b93b8",
        bone: "#e7ebff",
        boneDim: "#aab2d8",
        boneFaint: "#6f78a3",
        rule: "rgba(168,176,224,0.14)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        serif: ["var(--font-serif)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        han: ["var(--font-han)", "serif"],
      },
      keyframes: {
        drift: {
          "0%,100%": { transform: "translateY(0) translateX(0)" },
          "50%": { transform: "translateY(-8px) translateX(4px)" },
        },
        pulseGlow: {
          "0%,100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
      animation: {
        drift: "drift 9s ease-in-out infinite",
        pulseGlow: "pulseGlow 4s ease-in-out infinite",
        shimmer: "shimmer 8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;

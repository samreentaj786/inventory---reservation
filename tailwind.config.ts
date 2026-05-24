import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-syne)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        bg: {
          primary: "#0A0A0B",
          secondary: "#111114",
          card: "#16161A",
          elevated: "#1C1C21",
        },
        border: {
          DEFAULT: "#2A2A32",
          bright: "#3A3A46",
        },
        text: {
          primary: "#E8E3D9",
          secondary: "#8A8599",
          muted: "#4A4855",
        },
        accent: {
          amber: "#F0A500",
          green: "#22C55E",
          red: "#EF4444",
          blue: "#60A5FA",
        },
      },
      animation: {
        "slide-up": "slide-up 0.4s ease forwards",
        "fade-in": "fade-in 0.3s ease forwards",
      },
    },
  },
  plugins: [],
};

export default config;

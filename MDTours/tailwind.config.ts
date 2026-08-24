import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#C4A15A",
          light: "#D4B56E",
          dark: "#A4843E",
        },
        navy: {
          DEFAULT: "#1B2430",
          light: "#2C3644",
        },
        cream: {
          DEFAULT: "#F4EFE6",
          dark: "#E8E0D2",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        search: "0 10px 40px rgba(0, 0, 0, 0.12)",
        card: "0 4px 20px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;

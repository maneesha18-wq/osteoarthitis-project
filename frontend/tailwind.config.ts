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
        // Master Design Palette
        navy: {
          900: "#0C1B2A",
          800: "#16324F", // Deep Navy primary
          700: "#1F4268",
          600: "#2B5885",
          100: "#E3EBF3",
          50: "#F0F5FA",
        },
        medBlue: {
          800: "#1B4454",
          700: "#245B70", // Medical Blue
          600: "#2F738E",
          100: "#E6EFF2",
          50: "#F2F7F9",
        },
        teal: {
          800: "#346662",
          700: "#3D7A75",
          600: "#4D9690", // Muted Medical Teal
          500: "#5CAFA9",
          200: "#B8DFDC",
          100: "#DDF1F0",
          50: "#F0FAF9",
        },
        surface: {
          offwhite: "#F4F7F8", // Cool Off-White
          white: "#FFFFFF",
          card: "#FFFFFF",
          border: "#E2E8F0",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(22, 50, 79, 0.05), 0 1px 2px 0 rgba(22, 50, 79, 0.03)",
        card: "0 4px 6px -1px rgba(22, 50, 79, 0.06), 0 2px 4px -1px rgba(22, 50, 79, 0.03)",
        elevated: "0 10px 15px -3px rgba(22, 50, 79, 0.08), 0 4px 6px -2px rgba(22, 50, 79, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;

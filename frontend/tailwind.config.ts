import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Minimal Sage Green & White Palette
        softBg: "#F5F8F4",
        lightSage: "#D5E5D5",
        sageAccent: {
          DEFAULT: "#6B9475",
          hover: "#5B8265",
          light: "#EBF2EB",
        },
        darkGreen: {
          DEFAULT: "#111914",
          light: "#1F2E24",
          muted: "#2F4235",
        },
        lightBorder: "#E1E9DF",

        // Compatibility Aliases to ensure complete coverage
        warmWhite: "#F5F8F4",
        softBeige: "#D5E5D5",
        beigeAccent: {
          DEFAULT: "#6B9475",
          hover: "#5B8265",
          light: "#EBF2EB",
        },
        darkBrown: {
          DEFAULT: "#111914",
          light: "#1F2E24",
          muted: "#2F4235",
        },

        // Palette Aliases for Consistent System Theming
        surface: {
          offwhite: "#F5F8F4",
          bg: "#F5F8F4",
          white: "#FFFFFF",
          card: "#FFFFFF",
          border: "#E1E9DF",
        },
        navy: {
          900: "#111914",
          800: "#111914",
          700: "#1F2E24",
          600: "#2F4235",
          100: "#D5E5D5",
          50: "#F5F8F4",
        },
        medBlue: {
          800: "#294536",
          700: "#6B9475",
          600: "#6B9475",
          100: "#D5E5D5",
          50: "#F5F8F4",
        },
        teal: {
          800: "#3E614D",
          700: "#5B8265",
          600: "#6B9475",
          500: "#7DA487",
          200: "#D5E5D5",
          100: "#EBF2EB",
          50: "#F5F8F4",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(41, 69, 54, 0.04), 0 1px 2px 0 rgba(41, 69, 54, 0.02)",
        card: "0 4px 6px -1px rgba(41, 69, 54, 0.05), 0 2px 4px -1px rgba(41, 69, 54, 0.02)",
        elevated: "0 10px 15px -3px rgba(41, 69, 54, 0.06), 0 4px 6px -2px rgba(41, 69, 54, 0.03)",
      },
    },
  },
  plugins: [],
};
export default config;

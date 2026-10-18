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
        // Minimal Warm White & Beige Palette
        warmWhite: "#FAF7F2",
        softBeige: "#E9DED1",
        beigeAccent: {
          DEFAULT: "#B49A83",
          hover: "#A3876F",
          light: "#F3EEE8",
        },
        darkBrown: {
          DEFAULT: "#40362F",
          light: "#63564D",
          muted: "#8C7C70",
        },
        lightBorder: "#E8E1D9",

        // Palette Aliases for Consistent System Theming
        surface: {
          offwhite: "#FAF7F2",
          white: "#FFFFFF",
          card: "#FFFFFF",
          border: "#E8E1D9",
        },
        navy: {
          900: "#40362F",
          800: "#40362F", // Dark brown primary text
          700: "#54473F",
          600: "#695A50",
          100: "#E9DED1",
          50: "#FAF7F2",
        },
        medBlue: {
          800: "#40362F",
          700: "#B49A83",
          600: "#B49A83",
          100: "#E9DED1",
          50: "#FAF7F2",
        },
        teal: {
          800: "#8C735D",
          700: "#A3876F",
          600: "#B49A83", // Beige accent primary
          500: "#C4AD98",
          200: "#E9DED1",
          100: "#F3EEE8",
          50: "#FAF7F2",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(64, 54, 47, 0.04), 0 1px 2px 0 rgba(64, 54, 47, 0.02)",
        card: "0 4px 6px -1px rgba(64, 54, 47, 0.05), 0 2px 4px -1px rgba(64, 54, 47, 0.02)",
        elevated: "0 10px 15px -3px rgba(64, 54, 47, 0.06), 0 4px 6px -2px rgba(64, 54, 47, 0.03)",
      },
    },
  },
  plugins: [],
};
export default config;

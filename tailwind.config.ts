import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4A90E2",
        text: {
          DEFAULT: "#212529",
          secondary: "#495057",
          muted: "#6C757D",
        },
        accent: "#E67E22",
        background: "#F8F9FA",
        card: "#FFFFFF",
      },
      boxShadow: {
        card: "0 10px 20px rgba(0, 0, 0, 0.04)",
      },
      borderRadius: {
        card: "16px",
      },
    },
  },
  plugins: [],
};
export default config;

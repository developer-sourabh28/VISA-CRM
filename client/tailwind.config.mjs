import typography from "@tailwindcss/typography";
import forms from "@tailwindcss/forms";
import aspectRatio from "@tailwindcss/aspect-ratio";
import animate from "tailwindcss-animate";
import path from "path";

export default {
  darkMode: 'class', // Changed from 'media' to 'class'
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base UI Colors
        background: "#F8F9FB",
        sidebar: "#FFFFFF", // Used in bg-sidebar
        card: "#FFFFFF",
        muted: "#F1F1F6",
        border: "#E5E7EB",
        text: "#1F2937",

        // Accent Colors
        primary: {
          DEFAULT: "#7C3AED",
          light: "#E9D8FD",
          dark: "#5B21B6",
          50: "#F5F3FF",
          100: "#EDE9FE", // Used for bg-primary-100
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9", // Used for text-primary-700
          800: "#5B21B6",
          900: "#4C1D95"
        },
        accent: "#E4E6FA",
        lavender: "#CBC6DD",
        softPurple: "#CCB6E3",
        error: "#EF4444",
        success: "#22C55E",

        // Dark mode colors
        dark: {
          background: "#111827",
          sidebar: "#1F2937",
          card: "#1F2937",
          muted: "#374151",
          border: "#374151",
          text: "#F9FAFB"
        }
      },
      borderRadius: {
        xl: "1.5rem",
        "2xl": "2rem",
        full: "9999px"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        heading: ["Poppins", "ui-sans-serif"]
      },
      boxShadow: {
        soft: "0 4px 12px rgba(0, 0, 0, 0.05)",
        glass: "0 8px 32px rgba(31, 38, 135, 0.1)",
        card: "0 2px 8px rgba(0, 0, 0, 0.04)",
        'dark-soft': "0 4px 12px rgba(0, 0, 0, 0.2)",
        'dark-glass': "0 8px 32px rgba(0, 0, 0, 0.3)",
        'dark-card': "0 2px 8px rgba(0, 0, 0, 0.2)"
      },
      spacing: {
        13: "3.25rem",
        15: "3.75rem",
        18: "4.5rem"
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "20px"
      }
    }
  },
  plugins: [
    typography,
    forms,
    aspectRatio,
    animate
  ],
  resolve: {
    alias: {
      "@": path.resolve("./src")
    }
  }
};

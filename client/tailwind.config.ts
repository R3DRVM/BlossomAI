import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // Brand colors
        brand: {
          pink: "#ff4fa0",
          purple: "#7353ff",
          bg: "radial-gradient(1200px 600px at 10% -10%, #22243a 0%, #0e1117 35%, #0b0c12 70%)",
          card: "rgba(255,255,255,0.04)",
          border: "rgba(255,255,255,0.08)",
        },
        text: {
          primary: "#ffffff",
          muted: "#a8b0bf",
        },
        // Legacy colors for compatibility
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        // Additional pink shades for brand consistency
        pink: {
          50: "hsl(320 100% 97%)",
          100: "hsl(320 90% 92%)",
          200: "hsl(320 85% 85%)",
          300: "hsl(320 80% 75%)",
          400: "hsl(320 75% 65%)",
          500: "hsl(330 81% 60%)",
          600: "hsl(330 85% 55%)",
          700: "hsl(330 90% 45%)",
          800: "hsl(330 95% 35%)",
          900: "hsl(330 100% 25%)",
          950: "hsl(330 100% 15%)",
        },
        rose: {
          50: "hsl(330 100% 97%)",
          100: "hsl(330 90% 92%)",
          200: "hsl(330 85% 85%)",
          300: "hsl(330 80% 75%)",
          400: "hsl(330 75% 65%)",
          500: "hsl(330 81% 60%)",
          600: "hsl(330 85% 55%)",
          700: "hsl(330 90% 45%)",
          800: "hsl(330 95% 35%)",
          900: "hsl(330 100% 25%)",
          950: "hsl(330 100% 15%)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float": "float 12s ease-in-out infinite",
      },
      boxShadow: {
        "glow": "0 0 80px rgba(255,79,160,.18)",
        "glow-purple": "0 0 80px rgba(115,83,255,.18)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;

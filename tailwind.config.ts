import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import tailwindAnimate from "tailwindcss-animate";

/**
 * Tailwind CSS configuration for Chakwal Grand.
 *
 * Design System:
 * - Primary: Deep gold palette (luxury brand identity)
 * - Dark mode first: All surfaces use dark variants
 * - Typography: Geist Sans + Playfair Display for headings
 * - Spacing: 4px base grid
 */
const config: Config = {
  darkMode: ["class"],

  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],

  safelist: [
    // Room & booking status border-left
    "border-l-status-available",
    "border-l-status-occupied",
    "border-l-status-maintenance",
    "border-l-status-cleaning",
    "border-l-status-blocked",
    // Status backgrounds (used in dynamic classes)
    "bg-status-available",
    "bg-status-occupied",
    "bg-status-maintenance",
    "bg-status-cleaning",
    "bg-status-blocked",
    // Role badge colors used in DashboardSidebar
    "bg-gold-500/20", "text-gold-400",   "border-gold-500/30",
    "bg-blue-500/20", "text-blue-400",   "border-blue-500/30",
    "bg-green-500/20","text-green-400",  "border-green-500/30",
    "bg-violet-500/20","text-violet-400","border-violet-500/30",
    "bg-orange-500/20","text-orange-400","border-orange-500/30",
  ],

  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },

    extend: {
      // ─── Color System ─────────────────────────────
      colors: {
        // ── Brand Gold ──
        gold: {
          50:  "#fdf9ec",
          100: "#faf0cb",
          200: "#f5de93",
          300: "#eec754",
          400: "#e8b530",
          500: "#C9A84C", // Primary brand gold
          600: "#a8831c",
          700: "#8B6914", // Dark gold for gradients
          800: "#6b4e14",
          900: "#4a3412",
          950: "#2a1c07",
        },

        // ── Semantic Mapping → CSS Variables ──
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",

        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // ── Surface system (dark mode specific) ──
        surface: {
          base:       "#0A0A0F", // Page background
          elevated:   "#111118", // Cards
          overlay:    "#16161E", // Modals, dropdowns
          border:     "#1E1E2A", // Borders
          highlight:  "#252530", // Hover states
        },

        // ── Status colors ──
        status: {
          available:  "#4CAF8C",
          occupied:   "#E05252",
          maintenance:"#F59E0B",
          cleaning:   "#818CF8",
          blocked:    "#6B7280",
        },
      },

      // ─── Typography ───────────────────────────────
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
        mono: ["var(--font-geist-mono)", ...fontFamily.mono],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },

      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },

      // ─── Border Radius ────────────────────────────
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      // ─── Shadows ──────────────────────────────────
      boxShadow: {
        "gold-sm":  "0 2px 8px rgba(201, 168, 76, 0.2)",
        "gold-md":  "0 4px 20px rgba(201, 168, 76, 0.3)",
        "gold-lg":  "0 8px 40px rgba(201, 168, 76, 0.4)",
        "card":     "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)",
        "card-lg":  "0 10px 40px rgba(0,0,0,0.5)",
        "glow-gold":"0 0 20px rgba(201, 168, 76, 0.5)",
      },

      // ─── Animations ───────────────────────────────
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "shimmer": {
          from: { backgroundPosition: "-200% 0" },
          to:   { backgroundPosition: "200% 0" },
        },
        "pulse-gold": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(201, 168, 76, 0.4)" },
          "50%":       { boxShadow: "0 0 0 8px rgba(201, 168, 76, 0)" },
        },
      },
      animation: {
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",
        "fade-in":         "fade-in 0.3s ease-out",
        "slide-in-right":  "slide-in-right 0.3s ease-out",
        "shimmer":         "shimmer 2s linear infinite",
        "pulse-gold":      "pulse-gold 2s ease-in-out infinite",
      },

      // ─── Background patterns ──────────────────────
      backgroundImage: {
        "gold-gradient":  "linear-gradient(135deg, #C9A84C, #8B6914)",
        "gold-shine":     "linear-gradient(135deg, #E8D5A3, #C9A84C, #8B6914)",
        "card-gradient":  "linear-gradient(145deg, #111118, #16161E)",
        "hero-gradient":  "linear-gradient(135deg, #0A0A0F 0%, #0F0F1A 50%, #16100A 100%)",
        "shimmer-gold":   "linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.15) 50%, transparent 100%)",
        "grid-pattern":   "linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)",
      },

      backgroundSize: {
        "grid": "60px 60px",
      },

      // ─── Spacing additions ────────────────────────
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "sidebar": "240px",
        "header": "64px",
      },
    },
  },

  plugins: [tailwindAnimate],
};

export default config;

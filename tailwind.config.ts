import type { Config } from "tailwindcss";

const withOpacity = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background:  withOpacity("--background-rgb"),
        foreground:  withOpacity("--foreground-rgb"),
        border:      withOpacity("--border-rgb"),
        input:       withOpacity("--input-rgb"),
        ring:        withOpacity("--ring-rgb"),
        card: {
          DEFAULT:    withOpacity("--card-rgb"),
          foreground: withOpacity("--card-foreground-rgb"),
        },
        popover: {
          DEFAULT:    withOpacity("--popover-rgb"),
          foreground: withOpacity("--popover-foreground-rgb"),
        },
        primary: {
          DEFAULT:    withOpacity("--primary-rgb"),
          foreground: withOpacity("--primary-foreground-rgb"),
        },
        secondary: {
          DEFAULT:    withOpacity("--secondary-rgb"),
          foreground: withOpacity("--secondary-foreground-rgb"),
        },
        muted: {
          DEFAULT:    withOpacity("--muted-rgb"),
          foreground: withOpacity("--muted-foreground-rgb"),
        },
        accent: {
          DEFAULT:    withOpacity("--accent-rgb"),
          foreground: withOpacity("--accent-foreground-rgb"),
        },
        destructive: {
          DEFAULT:    withOpacity("--destructive-rgb"),
          foreground: withOpacity("--destructive-foreground-rgb"),
        },
        success: withOpacity("--success-rgb"),
        warning: withOpacity("--warning-rgb"),
        chart: {
          "1": withOpacity("--chart-1-rgb"),
          "2": withOpacity("--chart-2-rgb"),
          "3": withOpacity("--chart-3-rgb"),
          "4": withOpacity("--chart-4-rgb"),
          "5": withOpacity("--chart-5-rgb"),
        },
        sidebar: {
          DEFAULT:              withOpacity("--sidebar-rgb"),
          foreground:           withOpacity("--sidebar-foreground-rgb"),
          primary:              withOpacity("--sidebar-primary-rgb"),
          "primary-foreground": withOpacity("--sidebar-primary-foreground-rgb"),
          accent:               withOpacity("--sidebar-accent-rgb"),
          "accent-foreground":  withOpacity("--sidebar-accent-foreground-rgb"),
          border:               withOpacity("--sidebar-border-rgb"),
          ring:                 withOpacity("--sidebar-ring-rgb"),
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;

// Manchly color system.
// `brand/charts/typography/base` are the light creator-suite palette.
// `user` and `userWarm` are updated to match the new Learner Portal specifications.
// `gradients` provide app-wide signature CTAs and hero backgrounds.
const colors = {
  brand: {
    primaryOrange: "#F5A623",
    actionBlue: "#2B52F6",
    successGreen: "#22C55E",
    noticeBlue: "#EFF6FF",
  },
  charts: {
    blue: "#2B52F6",
    purple: "#6B5CF6",
    teal: "#1C9DA6",
    orange: "#F59E0B",
  },
  typography: {
    primaryText: "#1F2937",
    secondaryText: "#64748B",
    iconText: "#475569",
    white: "#FFFFFF",
  },
  base: {
    appBackground: "#F8FAFC",
    cardBackground: "#FFFFFF",
    hoverBackground: "#F1F5F9",
    border: "#E2E8F0",
  },

  // ---- Learner Portal Palette (Standard Light Mode) ----
  user: {
    bg: "#F8FAFC", // Off-white slate background
    card: "#FFFFFF", // Pure white surface
    cardSoft: "#F1F5F9", // Soft hover background
    nav: "#FFFFFF", // Clean sidebar background
    accent: "#22C55E", // Active green accent bar & indicator
    accentSoft: "#ECFDF5", // Soft mint background for active state
    accentText: "#1F2937", // Active state text color
    subHeading: "#64748B", // Secondary text color
    text: "#1F2937", // High-contrast primary text
    icon: "#475569", // Default icon stroke color
    border: "#E2E8F0", // Subtle divider & border stroke
    highlight: "#F59E0B", // Amber for saved items / streaks
    logout: "#EF4444",
    primary: "#2B52F6", // Brand Blue
    activeAccent: "#22C55E", // Green Active Accent / Left Bar
    activeBg: "#ECFDF5", // Mint Soft Active Background
    hoverBg: "#F1F5F9", // Light Gray/Slate Hover State
    surfaceBg: "#F8FAFC", // Page Background
    cardBg: "#FFFFFF", // Container / Card Background        // Red accent for logout action
  },

  // ---- Learner Portal Palette (Warm / Editorial Variant) ----
  userWarm: {
    bg: "#F8FAFC", // Clean slate canvas
    card: "#FFFFFF", // Container background
    cardSoft: "#F1F5F9", // Active hover container
    nav: "#FFFFFF", // Navigation container
    accent: "#22C55E", // Emerald green action accent
    accentSoft: "#ECFDF5", // Mint soft active pill background
    accentText: "#1F2937", // Main active text
    subHeading: "#64748B", // Slate secondary text
    text: "#1F2937", // Main body text
    icon: "#475569", // Default line icon color
    border: "#E2E8F0", // Section divider color
    highlight: "#F59E0B", // Highlight amber
  },

  // Navigation category accents (Learner Portal Feature Colors)
  navItems: {
    explore: "#22C55E", // Green
    myLearning: "#2B52F6", // Royal Blue
    sessions: "#1C9DA6", // Teal
    communities: "#6B5CF6", // Purple
    saved: "#F59E0B", // Amber
    logout: "#EF4444", // Red
  },

  creator: {
    bg: "#0D0D1A",
    surface: "#141428",
    card: "#16213E",
    cardLight: "#1A2744",
    border: "#0F3460",
    accent: "#0F3460",
    accentLight: "#1A56DB",
    gold: "#F0C040",
    goldDark: "#D69C40",
    text: "#FFFFFF",
    textSecondary: "#A0A0B2",
    textMuted: "#6B6B80",
  },
  ai: {
    primary: "#60A5FA",
    bg: "#0F0F1A",
    card: "#1A1040",
  },
  status: {
    success: "#22C55E",
    error: "#EF4444",
    info: "#2B52F6",
    warning: "#F59E0B",
  },

  gradients: {
    gold: "linear-gradient(135deg, #F3C36B 0%, #D49A3D 100%)",
    greenButton: "linear-gradient(135deg, #86EFAC 0%, #4ADE80 100%)",
    greenButtonDark: "linear-gradient(135deg, #4ADE80 0%, #16A34A 100%)",
    goldSoft: "linear-gradient(135deg, #F8DEAE 0%, #D69C3F 100%)",
    indigo: "linear-gradient(135deg, #2B52F6 0%, #6B5CF6 100%)",
    terracotta: "linear-gradient(135deg, #22C55E 0%, #1C9DA6 100%)",
    mint: "linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%)",
    blue: "linear-gradient(135deg, #0F3460 0%, #1A56DB 100%)",
    heroNavy: "linear-gradient(135deg, #0D112B 0%, #1A2755 55%, #2B52F6 130%)",
    heroDusk: "linear-gradient(135deg, #1A1040 0%, #3B2E8C 60%, #6B5CF6 140%)",
    heroWarm:"linear-gradient(135deg, #0C4A52 0%, #1C9DA6 50%, #22C55E 105%)", 
    orange: "linear-gradient(135deg, #F7B733 0%, #F5A623 55%, #ED8F03 100%)",
    teal: "linear-gradient(135deg, #1C9DA6 0%, #059669 100%)",
    purple: "linear-gradient(135deg, #6B5CF6 0%, #4C1D95 100%)",
    danger: "linear-gradient(135deg, #F87171 0%, #EF4444 100%)",
    mintGlow: "linear-gradient(120deg, #ECFDF5 0%, #FFFFFF 100%)",
    buttonBlue: "linear-gradient(135deg, #2B52F6 0%, #6B5CF6 100%)",
  },
};

export default colors;

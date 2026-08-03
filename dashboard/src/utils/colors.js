// Manchly color system.
// `brand/charts/typography/base` are the light creator-suite palette (Radhika's
// design). `user` and `creator` mirror the mobile app's role themes
// (manApp/src/utils/colors.ts) so the web app reads as the same product.
// `gradients` are the app's signature CTA/hero gradients.
const colors = {
  brand: {
    primaryOrange: '#F5A623',
    actionBlue: '#2563EB',
    successGreen: '#22C55E',
    noticeBlue: '#EFF6FF',
  },
  charts: {
    blue: '#3B82F6',
    purple: '#8B5CF6',
    teal: '#10B981',
    orange: '#F5A623',
  },
  typography: {
    primaryText: '#1F2937',
    secondaryText: '#6B7280',
    white: '#FFFFFF',
  },
  base: {
    appBackground: '#F9FAFB',
    cardBackground: '#FFFFFF',
    border: '#E5E7EB',
  },

  // ---- Mobile-app parity palettes ----
  user: {
    bg: '#0D112B',
    card: '#1A1E38',
    cardSoft: '#242843',
    nav: '#080C25',
    accent: '#4F60FA',
    accentSoft: '#BDC2FF',
    accentText: '#0013A0',
    subHeading: '#73799B',
    text: '#FFFFFF',
    border: 'rgba(255,255,255,0.08)',
  },
  creator: {
    bg: '#0D0D1A',
    surface: '#141428',
    card: '#16213E',
    cardLight: '#1A2744',
    border: '#0F3460',
    accent: '#0F3460',
    accentLight: '#1A56DB',
    gold: '#F0C040',
    goldDark: '#D69C40',
    text: '#FFFFFF',
    textSecondary: '#A0A0B2',
    textMuted: '#6B6B80',
  },
  ai: {
    primary: '#60A5FA',
    bg: '#0F0F1A',
    card: '#1A1040',
  },
  status: {
    success: '#22C55E',
    error: '#EF4444',
    info: '#3B82F6',
    warning: '#F59E0B',
  },

  gradients: {
    // Gold CTA gradient (app onboarding / creator CTAs)
    gold: 'linear-gradient(135deg, #F3C36B 0%, #D49A3D 100%)',
    goldSoft: 'linear-gradient(135deg, #F8DEAE 0%, #D69C3F 100%)',
    // User-side button gradient
    indigo: 'linear-gradient(135deg, #5A68F3 0%, #7B88DD 100%)',
    // Creator blue gradient (cGradientStart → cGradientEnd)
    blue: 'linear-gradient(135deg, #0F3460 0%, #1A56DB 100%)',
    // Hero / decorative gradients
    heroNavy: 'linear-gradient(135deg, #0D112B 0%, #1A2755 55%, #4F60FA 130%)',
    heroDusk: 'linear-gradient(135deg, #1A1040 0%, #3B2E8C 60%, #60A5FA 140%)',
    heroGold: 'linear-gradient(120deg, #2A1D06 0%, #8A6217 60%, #F3C36B 140%)',
    orange: 'linear-gradient(135deg, #F7B733 0%, #F5A623 55%, #ED8F03 100%)',
    teal: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    purple: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
    danger: 'linear-gradient(135deg, #F87171 0%, #DC2626 100%)',
  },
};

export default colors;

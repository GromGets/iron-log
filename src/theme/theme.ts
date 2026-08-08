import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// IRON & CHALK — design tokens
// A dark, graphite-and-chalk palette with a brass/iron-oxide accent.
// Numbers (weights, reps, PRs) are set in monospace to read like a plate
// display / gym clock — the one signature typographic move of this app.
// ---------------------------------------------------------------------------

export const colors = {
  bg: '#121316',
  surface: '#1B1D22',
  surfaceElevated: '#24272E',
  surfaceSunken: '#0D0E10',
  border: '#2E3138',

  textPrimary: '#F2F0EA',
  textSecondary: '#8D9199',
  textFaint: '#5B5F68',

  accent: '#E3A548', // brass / iron plate
  accentDim: '#8A6A34',
  accentSoft: 'rgba(227, 165, 72, 0.14)',

  positive: '#6FCF7A',
  positiveSoft: 'rgba(111, 207, 122, 0.14)',
  danger: '#E2574C',
  dangerSoft: 'rgba(226, 87, 76, 0.14)',

  chartLine: '#E3A548',
  chartGrid: '#2A2D33',
};

export const font = {
  // System monospace, used ONLY for numeric stats (weights/reps/dates on charts)
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  // System default for everything else
  body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  bodyMedium: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
};

export const type = {
  display: { fontFamily: font.mono, fontSize: 40, fontWeight: '700' as const, color: colors.textPrimary },
  statLarge: { fontFamily: font.mono, fontSize: 28, fontWeight: '700' as const, color: colors.textPrimary },
  statMedium: { fontFamily: font.mono, fontSize: 18, fontWeight: '600' as const, color: colors.textPrimary },
  title: { fontFamily: font.bodyMedium, fontSize: 20, fontWeight: '700' as const, color: colors.textPrimary },
  subtitle: { fontFamily: font.bodyMedium, fontSize: 15, fontWeight: '600' as const, color: colors.textPrimary },
  body: { fontFamily: font.body, fontSize: 15, fontWeight: '400' as const, color: colors.textPrimary },
  bodySecondary: { fontFamily: font.body, fontSize: 14, fontWeight: '400' as const, color: colors.textSecondary },
  caption: {
    fontFamily: font.bodyMedium,
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
};

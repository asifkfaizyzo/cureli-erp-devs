// src/theme/typography.ts
//
// Type scale for Cureli Mobile.
// Font family: Inter (loaded via expo-font in _layout.tsx)
//
// Usage:
//   import { Typography } from '../theme/typography';
//   style={Typography.h1}

export const FontFamily = {
  regular:     'Inter_400Regular',
  medium:      'Inter_500Medium',
  semiBold:    'Inter_600SemiBold',
  bold:        'Inter_700Bold',
  extraBold:   'Inter_800ExtraBold',
} as const;

export const Typography = {
  // ── Display ───────────────────────────────────────────────
  display: {
    fontSize: 36,
    fontFamily: 'Inter_800ExtraBold',
    lineHeight: 44,
    letterSpacing: -0.5,
  },

  // ── Headings ──────────────────────────────────────────────
  h1: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    lineHeight: 30,
  },
  h3: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 26,
  },
  h4: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 24,
  },

  // ── Body ──────────────────────────────────────────────────
  bodyLarge: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 26,
  },
  body: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  bodyMedium: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    lineHeight: 22,
  },
  bodySemiBold: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 22,
  },

  // ── Small ─────────────────────────────────────────────────
  small: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  smallMedium: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    lineHeight: 18,
  },
  smallBold: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    lineHeight: 18,
  },

  // ── Label / Caption ───────────────────────────────────────
  label: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },

  // ── Button ────────────────────────────────────────────────
  buttonLarge: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    lineHeight: 24,
  },
  button: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 20,
  },
  buttonSmall: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 18,
  },
} as const;
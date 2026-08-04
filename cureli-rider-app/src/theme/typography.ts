export const FontFamily = {
  regular:     'Inter_400Regular',
  medium:      'Inter_500Medium',
  semiBold:    'Inter_600SemiBold',
  bold:        'Inter_700Bold',
  extraBold:   'Inter_800ExtraBold',
  amulya:      'Amulya-Variable',
  amulyaBold:  'Amulya-Bold',
} as const;

export const Typography = {
  display: {
    fontSize: 36,
    fontFamily: FontFamily.extraBold,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  h1: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    lineHeight: 30,
  },
  h3: {
    fontSize: 18,
    fontFamily: FontFamily.semiBold,
    lineHeight: 26,
  },
  h4: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 16,
    fontFamily: FontFamily.regular,
    lineHeight: 26,
  },
  body: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
  },
  bodyMedium: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    lineHeight: 22,
  },
  bodySemiBold: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    lineHeight: 22,
  },
  small: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
  },
  smallMedium: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    lineHeight: 18,
  },
  smallBold: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    lineHeight: 18,
  },
  label: {
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    lineHeight: 16,
  },
  buttonLarge: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    lineHeight: 24,
  },
  button: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    lineHeight: 20,
  },
  buttonSmall: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    lineHeight: 18,
  },
  wordmark: {
    fontSize: 26,
    fontFamily: FontFamily.amulya,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
} as const;
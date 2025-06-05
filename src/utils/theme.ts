import { StyleSheet, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  background: '#1A1A1A',
  surface: '#2A2A2A',
  surfaceVariant: '#3A3A3A',
  
  primary: '#FFA500',
  primaryVariant: '#FF8C00',
  primaryDisabled: '#FFA50080',
  
  secondary: '#ADD8E6',
  secondaryVariant: '#87CEEB',
  secondaryDisabled: '#ADD8E680',
  
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textTertiary: '#808080',
  textDisabled: '#606060',
  
  textOnPrimary: '#000000',
  textOnSecondary: '#000000',
  
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  border: '#404040',
  borderFocus: '#FFA500',
  borderError: '#F44336',
  
  overlay: '#00000080',
  overlayLight: '#00000040',
  
  accessibility: {
    focus: '#FFA500',
    focusRing: '#FFA50080',
    highContrast: {
      background: '#000000',
      surface: '#1A1A1A',
      text: '#FFFFFF',
      border: '#FFFFFF',
    },
  },
} as const;

export const typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
    '6xl': 48,
  },
  
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 32,
    '2xl': 36,
    '3xl': 40,
    '4xl': 44,
    '5xl': 48,
    '6xl': 60,
  },
  
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
  '7xl': 96,
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 16,
  },
} as const;

export const accessibility = {
  minTouchTarget: 44,
  focusOutlineWidth: 2,
  
  contrastRatios: {
    normal: {
      aa: 4.5,
      aaa: 7,
    },
    large: {
      aa: 3,
      aaa: 4.5,
    },
  },
  
  fontSize: {
    minimum: 16,
    large: 20,
    extraLarge: 24,
    maximum: 32,
  },
  
  timing: {
    short: 150,
    medium: 300,
    long: 500,
    reduced: 0,
  },
} as const;

export const componentStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,
  
  surface: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.base,
    padding: spacing.base,
  } as ViewStyle,
  
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  } as ViewStyle,
  
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: accessibility.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  
  buttonSecondary: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: accessibility.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: accessibility.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    minHeight: accessibility.minTouchTarget,
  } as ViewStyle & TextStyle,
  
  inputFocused: {
    borderColor: colors.borderFocus,
    borderWidth: 2,
  } as ViewStyle,
  
  inputError: {
    borderColor: colors.borderError,
  } as ViewStyle,
});

export const textStyles = StyleSheet.create({
  h1: {
    fontSize: typography.fontSize['4xl'],
    lineHeight: typography.lineHeight['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: typography.letterSpacing.tight,
  } as TextStyle,
  
  h2: {
    fontSize: typography.fontSize['3xl'],
    lineHeight: typography.lineHeight['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: typography.letterSpacing.tight,
  } as TextStyle,
  
  h3: {
    fontSize: typography.fontSize['2xl'],
    lineHeight: typography.lineHeight['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  } as TextStyle,
  
  h4: {
    fontSize: typography.fontSize.xl,
    lineHeight: typography.lineHeight.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  } as TextStyle,
  
  body: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.fontWeight.normal,
    color: colors.textPrimary,
  } as TextStyle,
  
  bodyLarge: {
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.fontWeight.normal,
    color: colors.textPrimary,
  } as TextStyle,
  
  bodySmall: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.fontWeight.normal,
    color: colors.textSecondary,
  } as TextStyle,
  
  caption: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.fontWeight.normal,
    color: colors.textTertiary,
  } as TextStyle,
  
  label: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  } as TextStyle,
  
  buttonText: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textOnPrimary,
  } as TextStyle,
  
  buttonTextSecondary: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textOnSecondary,
  } as TextStyle,
  
  error: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.fontWeight.normal,
    color: colors.error,
  } as TextStyle,
  
  success: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.fontWeight.normal,
    color: colors.success,
  } as TextStyle,
});

export const accessibilityStyles = StyleSheet.create({
  focusRing: {
    borderWidth: accessibility.focusOutlineWidth,
    borderColor: colors.accessibility.focus,
  } as ViewStyle,
  
  highContrastBorder: {
    borderWidth: 1,
    borderColor: colors.accessibility.highContrast.border,
  } as ViewStyle,
  
  screenReaderOnly: {
    position: 'absolute',
    left: -10000,
    top: 'auto',
    width: 1,
    height: 1,
    overflow: 'hidden',
  } as ViewStyle,
  
  skipLink: {
    position: 'absolute',
    top: -100,
    left: spacing.base,
    backgroundColor: colors.primary,
    color: colors.textOnPrimary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    zIndex: 1000,
  } as ViewStyle & TextStyle,
  
  skipLinkFocused: {
    top: spacing.base,
  } as ViewStyle,
});

export const voiceStyles = StyleSheet.create({
  listeningIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  } as ViewStyle,
  
  waveform: {
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.base,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  
  voiceButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.xl,
  } as ViewStyle,
  
  voiceButtonActive: {
    backgroundColor: colors.error,
    transform: [{ scale: 1.1 }],
  } as ViewStyle,
});

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  accessibility,
  componentStyles,
  textStyles,
  accessibilityStyles,
  voiceStyles,
};
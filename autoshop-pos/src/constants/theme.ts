export const Colors = {
  // Primary brand
  primary: '#1A56DB',
  primaryDark: '#1345B8',
  primaryLight: '#E8EFFD',

  // Status colors
  success: '#0E9F6E',
  successLight: '#DEF7EC',
  warning: '#C27803',
  warningLight: '#FDF6B2',
  danger: '#E02424',
  dangerLight: '#FDE8E8',

  // Neutrals
  black: '#111928',
  gray900: '#1F2A37',
  gray700: '#374151',
  gray500: '#6B7280',
  gray300: '#D1D5DB',
  gray100: '#F3F4F6',
  white: '#FFFFFF',

  // Background
  background: '#F9FAFB',
  surface: '#FFFFFF',
  border: '#E5E7EB',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Typography = {
  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,

  // Font weights (React Native uses string literals)
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const Colors = {
  // Brand Colors — mapped from website :root
  primary: '#C10207',
  primaryDark: '#9A0205',
  primaryLight: '#E63946',

  secondary: '#D6C8AF',
  secondaryDark: '#C4B499',
  secondaryLight: '#E8DCD0',

  // Backgrounds
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#E5DCD0',

  // Text
  text: '#2A1A1A',
  textSecondary: '#5C4E43',
  textDisabled: '#B5B5B5',
  textInverse: '#FFFFFF',

  // Borders
  border: '#E8D5C4',
  borderFocus: '#ED0200',

  // Status
  error: '#DC2626',
  errorLight: '#FFEBEE',

  success: '#2E7D32',
  successLight: '#E8F5E9',

  warning: '#F57C00',
  warningLight: '#FFF3E0',

  // Utility
  overlay: 'rgba(0,0,0,0.55)',
  transparent: 'transparent',

  // Navigation
  tabBar: '#FFFFFF',
  tabBarActive: '#C10207',
  tabBarInactive: '#9E9E9E',

  // Badge
  badge: '#FFC107',
  badgeText: '#7A4300',

  // Inputs
  placeholder: '#C8C8C8',

  // Skeleton Loading
  shimmer: '#E5DCD0',

  // Extra Brand Colors
  gold: '#EFA836',
  goldDark: '#D48D1E',
  goldLight: '#FFD54F',

  flameOrange: '#FF8F00',
  flameOrangeDark: '#E65100',
  flameOrangeLight: '#FFB74D',

  kebabRed: '#C10207',
  kebabRedDark: '#9A0205',
  kebabRedLight: '#E63946',
};

export const ColorsDark = {
  // Brand Colors — mapped from website .dark
  primary: '#E63946',
  primaryDark: '#B71C10',
  primaryLight: '#FF6B4A',

  secondary: '#271515',
  secondaryDark: '#1E0F0F',
  secondaryLight: '#3A2020',

  // Backgrounds
  background: '#0C0505',
  surface: '#160B0B',
  surfaceElevated: '#231212',

  // Text
  text: '#EAE0D5',
  textSecondary: '#A3928B',
  textDisabled: '#6B5D55',
  textInverse: '#FFFFFF',

  // Borders
  border: '#301818',
  borderFocus: '#E63946',

  // Status
  error: '#EF4444',
  errorLight: '#3A1515',

  success: '#4ADE80',
  successLight: '#1A3A1A',

  warning: '#FFB703',
  warningLight: '#3A2A00',

  // Utility
  overlay: 'rgba(0,0,0,0.7)',
  transparent: 'transparent',

  // Navigation
  tabBar: '#0C0505',
  tabBarActive: '#E63946',
  tabBarInactive: '#6B5D55',

  // Badge
  badge: '#FFB703',
  badgeText: '#0C0505',

  // Inputs
  placeholder: '#5A4A44',

  // Skeleton Loading
  shimmer: '#271515',

  // Extra Brand Colors
  gold: '#FFB703',
  goldDark: '#E09A00',
  goldLight: '#FFD54F',

  flameOrange: '#FF8F00',
  flameOrangeDark: '#E65100',
  flameOrangeLight: '#FFB74D',

  kebabRed: '#E63946',
  kebabRedDark: '#B71C10',
  kebabRedLight: '#FF6B4A',
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
};

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
  black: '900' as const,
};

export const FontFamily = {
  regular: 'Sora_400Regular',
  medium: 'Sora_500Medium',
  semiBold: 'Sora_600SemiBold',
  bold: 'Sora_700Bold',
  extraBold: 'Sora_800ExtraBold',
  black: 'Sora_800ExtraBold',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BorderRadii = {
  sm: 3,
  md: 6,
  lg: 10,
  xl: 16,
  xxl: 20,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  flame: {
    shadowColor: '#C10207',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
};

export function buildTheme(colors: typeof Colors) {
  return {
    colors,
    fontSizes: FontSizes,
    fontWeights: FontWeights,
    fontFamily: FontFamily,
    spacing: Spacing,
    borderRadii: BorderRadii,
    shadows: Shadows,
  };
}

export const Theme = buildTheme(Colors);

export default Theme;

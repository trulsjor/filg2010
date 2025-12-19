import type { Theme, ThemeColors, ThemeTypography, ThemeBorders, ThemeShadows, ThemeSpacing, ThemeNavbar } from './ThemeDefinitions'

const elevatedFonts = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

const elevatedTypography: ThemeTypography = {
  fontFamily: elevatedFonts,
  fontFamilyHeading: elevatedFonts,
  fontSizeBase: '16px',
  fontWeightNormal: '400',
  fontWeightMedium: '500',
  fontWeightBold: '700',
  lineHeightNormal: '1.6',
  letterSpacing: '0.01em',
}

const elevatedBorders: ThemeBorders = {
  radiusNone: '0',
  radiusSm: '8px',
  radiusMd: '12px',
  radiusLg: '16px',
  radiusXl: '24px',
  radiusFull: '9999px',
  widthDefault: '0px',  // No borders, rely on shadows
  widthStrong: '1px',
}

// Prominent shadows for the elevated look
const elevatedShadows: ThemeShadows = {
  none: 'none',
  sm: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
  md: '0 4px 20px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
  lg: '0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.08)',
  xl: '0 24px 60px rgba(0, 0, 0, 0.20), 0 8px 24px rgba(0, 0, 0, 0.10)',
}

const elevatedSpacing: ThemeSpacing = { scale: 1.1 }

const elevatedNavbar: ThemeNavbar = {
  background: '#ffffff',
  textColor: '#1f2937',
  textColorMuted: '#6b7280',
  activeIndicator: 'background',
  activeColor: '#3b82f6',
  borderRadius: '12px',
  fullWidth: true,
  logoHeight: 'h-10 md:h-16',
  logoTextAlign: 'items-center',
  logoTextSize: 'text-xl md:text-2xl',
  logoGap: 'gap-4 md:gap-8',
  height: 'h-16',
  heightMd: 'h-20',
}

// Elevated Light Colors - clean whites with blue accent
const elevatedColors: ThemeColors = {
  // Bakgrunn - soft grays
  backgroundDefault: '#f3f4f6',
  backgroundSubtle: '#e5e7eb',
  backgroundMuted: '#d1d5db',

  // Overflater - pure white for elevated cards
  surfaceDefault: '#ffffff',
  surfaceRaised: '#ffffff',
  surfaceHover: '#f9fafb',
  surfaceActive: '#f3f4f6',

  // Kanter - subtle
  borderSubtle: '#e5e7eb',
  borderDefault: '#d1d5db',
  borderStrong: '#9ca3af',

  // Tekst
  textDefault: '#111827',
  textSubtle: '#374151',
  textMuted: '#6b7280',
  textOnAccent: '#ffffff',

  // Accent - vibrant blue
  accentSubtle: '#dbeafe',
  accentBase: '#3b82f6',
  accentHover: '#2563eb',
  accentActive: '#1d4ed8',
  accentText: '#2563eb',

  // Status farger
  successSubtle: '#dcfce7',
  successBase: '#22c55e',
  successText: '#16a34a',

  warningSubtle: '#fef3c7',
  warningBase: '#f59e0b',
  warningText: '#d97706',

  dangerSubtle: '#fee2e2',
  dangerBase: '#ef4444',
  dangerText: '#dc2626',

  focusRing: '#3b82f6',

  // Palette - modern, vibrant colors
  'palette-1': '#3b82f6',  // Blue - primary
  'palette-2': '#8b5cf6',  // Violet - secondary
  'palette-3': '#ec4899',  // Pink - accent
  'palette-4': '#f59e0b',  // Amber - warning
  'palette-5': '#10b981',  // Emerald - success
  'palette-6': '#06b6d4',  // Cyan - info
  'palette-7': '#f97316',  // Orange - highlight
  'palette-8': '#ef4444',  // Red - danger
  'palette-9': '#6b7280',  // Gray - muted
}

export const elevatedTheme: Theme = {
  id: 'elevated',
  name: 'Elevated',
  colorScheme: 'light',
  colors: elevatedColors,
  typography: elevatedTypography,
  borders: elevatedBorders,
  shadows: elevatedShadows,
  spacing: elevatedSpacing,
  logo: {
    light: '/fjellhammer-logo.svg',
    dark: '/fjellhammer-logo.svg',
  },
  navbar: elevatedNavbar,
}

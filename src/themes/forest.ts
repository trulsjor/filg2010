import type { Theme, ThemeColors, ThemeTypography, ThemeBorders, ThemeShadows, ThemeSpacing } from './ThemeDefinitions'

const systemFonts = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
const serifFonts = "Georgia, 'Times New Roman', serif"

const forestTypography: ThemeTypography = {
  fontFamily: "'Nunito', " + systemFonts,
  fontFamilyHeading: "'Playfair Display', " + serifFonts,
  fontSizeBase: '16px',
  fontWeightNormal: '400',
  fontWeightMedium: '500',
  fontWeightBold: '600',
  lineHeightNormal: '1.65',
  letterSpacing: '0.01em',
}

const forestBorders: ThemeBorders = {
  radiusNone: '0',
  radiusSm: '6px',
  radiusMd: '10px',
  radiusLg: '14px',
  radiusXl: '20px',
  radiusFull: '9999px',
  widthDefault: '1px',
  widthStrong: '2px',
}

const forestShadows: ThemeShadows = {
  none: 'none',
  sm: '0 2px 6px rgba(45, 58, 41, 0.08)',
  md: '0 4px 12px rgba(45, 58, 41, 0.1)',
  lg: '0 8px 20px rgba(45, 58, 41, 0.12)',
  xl: '0 16px 32px rgba(45, 58, 41, 0.15)',
}

const forestSpacing: ThemeSpacing = { scale: 1.1 }

const forestColors: ThemeColors = {
  backgroundDefault: '#f5f7f4',
  backgroundSubtle: '#eef2ec',
  backgroundMuted: '#dde5d9',

  surfaceDefault: '#ffffff',
  surfaceRaised: '#fafcf9',
  surfaceHover: '#f0f4ee',
  surfaceActive: '#e5ebe2',

  borderSubtle: '#d4ddd0',
  borderDefault: '#b8c7b2',
  borderStrong: '#8a9e82',

  textDefault: '#2d3a29',
  textSubtle: '#4a5d44',
  textMuted: '#6b7d65',
  textOnAccent: '#ffffff',

  accentSubtle: '#e8f0e6',
  accentBase: '#3d7a3d',
  accentHover: '#2e6b2e',
  accentActive: '#1f5c1f',
  accentText: '#2e6b2e',

  successSubtle: '#e6f4e6',
  successBase: '#228b22',
  successText: '#1a6b1a',

  warningSubtle: '#fdf6e3',
  warningBase: '#b8860b',
  warningText: '#996600',

  dangerSubtle: '#fde8e8',
  dangerBase: '#8b0000',
  dangerText: '#a02020',

  focusRing: '#3d7a3d',

  'palette-1': '#4682B4',
  'palette-2': '#2E8B57',
  'palette-3': '#B56576',
  'palette-4': '#6B5B7A',
  'palette-5': '#CD853F',
  'palette-6': '#CC704B',
  'palette-7': '#5F9EA0',
  'palette-8': '#6B8E23',
  'palette-9': '#7A8B7A',
}

export const forestTheme: Theme = {
  id: 'forest',
  name: 'Skog & Natur',
  colorScheme: 'light',
  colors: forestColors,
  typography: forestTypography,
  borders: forestBorders,
  shadows: forestShadows,
  spacing: forestSpacing,
}

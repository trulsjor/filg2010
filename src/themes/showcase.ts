import type { Theme, ThemeColors, ThemeTypography, ThemeBorders, ThemeShadows, ThemeSpacing, ThemeNavbar } from './ThemeDefinitions'

const showcaseFonts = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

const showcaseTypography: ThemeTypography = {
  fontFamily: showcaseFonts,
  fontFamilyHeading: showcaseFonts,
  fontSizeBase: '16px',
  fontWeightNormal: '400',
  fontWeightMedium: '500',
  fontWeightBold: '700',
  lineHeightNormal: '1.6',
  letterSpacing: '0.01em',
}

const showcaseBorders: ThemeBorders = {
  radiusNone: '0',
  radiusSm: '4px',
  radiusMd: '8px',
  radiusLg: '12px',
  radiusXl: '16px',
  radiusFull: '9999px',
  widthDefault: '1px',
  widthStrong: '2px',
}

const showcaseShadows: ThemeShadows = {
  none: 'none',
  sm: '0 1px 3px rgba(124, 58, 237, 0.15)',
  md: '0 4px 16px rgba(124, 58, 237, 0.2)',
  lg: '0 8px 32px rgba(124, 58, 237, 0.25)',
  xl: '0 16px 48px rgba(124, 58, 237, 0.3)',
}

const showcaseSpacing: ThemeSpacing = { scale: 1 }

const showcaseNavbar: ThemeNavbar = {
  background: '#1e1b4b',
  textColor: '#e0e7ff',
  textColorMuted: '#a5b4fc',
  activeIndicator: 'underline',
  activeColor: '#f472b6',
  borderRadius: '0',
  fullWidth: true,
  logoHeight: 'h-10 md:h-16',
  logoTextAlign: 'items-center',
  logoTextSize: 'text-xl md:text-2xl',
  logoGap: 'gap-4 md:gap-8',
  height: 'h-16',
  heightMd: 'h-20',
}

// Showcase Colors - vibrant purple/pink theme to demonstrate all features
const showcaseColors: ThemeColors = {
  // Bakgrunn - deep purple/indigo
  backgroundDefault: '#0f0a1f',
  backgroundSubtle: '#1e1b4b',
  backgroundMuted: '#312e81',

  // Overflater
  surfaceDefault: '#1e1b4b',
  surfaceRaised: '#312e81',
  surfaceHover: '#3730a3',
  surfaceActive: '#4338ca',

  // Kanter
  borderSubtle: '#4338ca',
  borderDefault: '#6366f1',
  borderStrong: '#818cf8',

  // Tekst
  textDefault: '#e0e7ff',
  textSubtle: '#c7d2fe',
  textMuted: '#a5b4fc',
  textOnAccent: '#0f0a1f',

  // Accent - rosa/magenta
  accentSubtle: '#3b0764',
  accentBase: '#f472b6',
  accentHover: '#f9a8d4',
  accentActive: '#db2777',
  accentText: '#f9a8d4',

  // Status farger - bright and distinct
  successSubtle: '#052e16',
  successBase: '#4ade80',
  successText: '#86efac',

  warningSubtle: '#451a03',
  warningBase: '#fbbf24',
  warningText: '#fcd34d',

  dangerSubtle: '#450a0a',
  dangerBase: '#f87171',
  dangerText: '#fca5a5',

  focusRing: '#f472b6',

  // Palette - rainbow of colors for visual variety
  'palette-1': '#f472b6',  // Pink - accent
  'palette-2': '#60a5fa',  // Blue - info
  'palette-3': '#a78bfa',  // Purple - secondary
  'palette-4': '#fbbf24',  // Amber - warning
  'palette-5': '#4ade80',  // Green - success
  'palette-6': '#22d3ee',  // Cyan - highlight
  'palette-7': '#fb923c',  // Orange - accent 2
  'palette-8': '#f87171',  // Red - danger
  'palette-9': '#94a3b8',  // Slate - muted
}

export const showcaseTheme: Theme = {
  id: 'showcase',
  name: 'Showcase',
  colorScheme: 'dark',
  colors: showcaseColors,
  typography: showcaseTypography,
  borders: showcaseBorders,
  shadows: showcaseShadows,
  spacing: showcaseSpacing,
  logo: {
    light: '/fjellhammer-logo.svg',
    dark: '/fjellhammer-logo.svg',
  },
  navbar: showcaseNavbar,
}

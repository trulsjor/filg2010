import type { Theme, ThemeColors, ThemeTypography, ThemeBorders, ThemeShadows, ThemeSpacing, ThemeNavbar } from './ThemeDefinitions'

const materialFonts = "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

const materialTypography: ThemeTypography = {
  fontFamily: materialFonts,
  fontFamilyHeading: materialFonts,
  fontSizeBase: '16px',
  fontWeightNormal: '400',
  fontWeightMedium: '500',
  fontWeightBold: '700',
  lineHeightNormal: '1.5',
  letterSpacing: '0.02em',
}

// Sharp corners for a more structured look
const materialBorders: ThemeBorders = {
  radiusNone: '0',
  radiusSm: '4px',
  radiusMd: '4px',
  radiusLg: '8px',
  radiusXl: '8px',
  radiusFull: '9999px',
  widthDefault: '0px',
  widthStrong: '2px',
}

// Strong, layered shadows for clear elevation
const materialShadows: ThemeShadows = {
  none: 'none',
  sm: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
  md: '0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
  lg: '0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.10)',
  xl: '0 15px 25px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.05)',
}

const materialSpacing: ThemeSpacing = { scale: 1 }

const materialNavbar: ThemeNavbar = {
  background: '#1976d2',
  textColor: '#ffffff',
  textColorMuted: 'rgba(255, 255, 255, 0.7)',
  activeIndicator: 'background',
  activeColor: 'rgba(255, 255, 255, 0.2)',
  borderRadius: '4px',
  fullWidth: true,
  logoHeight: 'h-10 md:h-16',
  logoTextAlign: 'items-center',
  logoTextSize: 'text-xl md:text-2xl',
  logoGap: 'gap-4 md:gap-8',
  height: 'h-16',
  heightMd: 'h-20',
}

// Material Design inspired colors - clean, flat, no gradients
const materialColors: ThemeColors = {
  // Bakgrunn - light gray canvas
  backgroundDefault: '#fafafa',
  backgroundSubtle: '#f5f5f5',
  backgroundMuted: '#eeeeee',

  // Overflater - white cards with elevation
  surfaceDefault: '#ffffff',
  surfaceRaised: '#ffffff',
  surfaceHover: '#f5f5f5',
  surfaceActive: '#eeeeee',

  // Kanter - minimal, rely on shadows
  borderSubtle: '#e0e0e0',
  borderDefault: '#bdbdbd',
  borderStrong: '#9e9e9e',

  // Tekst - high contrast
  textDefault: '#212121',
  textSubtle: '#424242',
  textMuted: '#757575',
  textOnAccent: '#ffffff',

  // Accent - Material blue
  accentSubtle: '#e3f2fd',
  accentBase: '#1976d2',
  accentHover: '#1565c0',
  accentActive: '#0d47a1',
  accentText: '#1976d2',

  // Status farger - bold, solid colors (no gradients)
  successSubtle: '#e8f5e9',
  successBase: '#4caf50',
  successText: '#2e7d32',

  warningSubtle: '#fff3e0',
  warningBase: '#ff9800',
  warningText: '#e65100',

  dangerSubtle: '#ffebee',
  dangerBase: '#f44336',
  dangerText: '#c62828',

  focusRing: '#1976d2',

  // Palette - Material Design palette
  'palette-1': '#1976d2',  // Blue 700
  'palette-2': '#7b1fa2',  // Purple 700
  'palette-3': '#c2185b',  // Pink 700
  'palette-4': '#ffa000',  // Amber 700
  'palette-5': '#388e3c',  // Green 700
  'palette-6': '#0097a7',  // Cyan 700
  'palette-7': '#f57c00',  // Orange 700
  'palette-8': '#d32f2f',  // Red 700
  'palette-9': '#616161',  // Gray 700
}

export const materialTheme: Theme = {
  id: 'material',
  name: 'Material',
  colorScheme: 'light',
  colors: materialColors,
  typography: materialTypography,
  borders: materialBorders,
  shadows: materialShadows,
  spacing: materialSpacing,
  logo: {
    light: '/fjellhammer-logo.svg',
    dark: '/fjellhammer-logo.svg',
  },
  navbar: materialNavbar,
}

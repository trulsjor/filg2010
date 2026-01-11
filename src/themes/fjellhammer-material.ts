import type {
  Theme,
  ThemeColors,
  ThemeTypography,
  ThemeBorders,
  ThemeShadows,
  ThemeSpacing,
  ThemeNavbar,
} from './ThemeDefinitions'

// Material typography with Roboto
const materialTypography: ThemeTypography = {
  fontFamily: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontFamilyHeading: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSizeBase: '16px',
  fontWeightNormal: '400',
  fontWeightMedium: '500',
  fontWeightBold: '700',
  lineHeightNormal: '1.5',
  letterSpacing: '0.02em',
}

// Sharp Material corners
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

// Strong layered shadows for light theme
const materialLightShadows: ThemeShadows = {
  none: 'none',
  sm: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
  md: '0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
  lg: '0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.10)',
  xl: '0 15px 25px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.05)',
}

// Shadows for dark theme
const materialDarkShadows: ThemeShadows = {
  none: 'none',
  sm: '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.5)',
  md: '0 3px 6px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.4)',
  lg: '0 10px 20px rgba(0, 0, 0, 0.5), 0 3px 6px rgba(0, 0, 0, 0.3)',
  xl: '0 15px 25px rgba(0, 0, 0, 0.5), 0 5px 10px rgba(0, 0, 0, 0.3)',
}

const materialSpacing: ThemeSpacing = { scale: 1 }

// Light navbar - Fjellhammer green
const lightNavbar: ThemeNavbar = {
  background: '#009B3E',
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

// Dark navbar - darker green
const darkNavbar: ThemeNavbar = {
  background: '#00652B',
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

// Fjellhammer Material Light - clean, flat, Fjellhammer green accent
const fjellhammerMaterialLightColors: ThemeColors = {
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

  // Accent - Fjellhammer green
  accentSubtle: '#e8f5e9',
  accentBase: '#009B3E',
  accentHover: '#00652B',
  accentActive: '#004d20',
  accentText: '#009B3E',

  // Status farger
  successSubtle: '#e8f5e9',
  successBase: '#4caf50',
  successText: '#2e7d32',

  warningSubtle: '#fff3e0',
  warningBase: '#ff9800',
  warningText: '#e65100',

  dangerSubtle: '#ffebee',
  dangerBase: '#f44336',
  dangerText: '#c62828',

  focusRing: '#009B3E',

  // Palette - grønn gradient fra fjellhammer.no
  'palette-1': '#00c462', // Fjellhammer grønn (lys)
  'palette-2': '#2d6a4f', // Mørk skogsgrønn
  'palette-3': '#40916c', // Medium grønn
  'palette-4': '#ffc107', // Gul
  'palette-5': '#52b788', // Frisk grønn
  'palette-6': '#74c69d', // Lys grønn
  'palette-7': '#95d5b2', // Mint grønn
  'palette-8': '#34d399', // Emerald
  'palette-9': '#9ca3af', // Grå
}

// Fjellhammer Material Dark - dark surfaces, green accent
const fjellhammerMaterialDarkColors: ThemeColors = {
  // Bakgrunn - dark gray
  backgroundDefault: '#121212',
  backgroundSubtle: '#1e1e1e',
  backgroundMuted: '#2c2c2c',

  // Overflater - elevated dark cards
  surfaceDefault: '#1e1e1e',
  surfaceRaised: '#2c2c2c',
  surfaceHover: '#383838',
  surfaceActive: '#424242',

  // Kanter
  borderSubtle: '#383838',
  borderDefault: '#424242',
  borderStrong: '#616161',

  // Tekst - light on dark
  textDefault: '#ffffff',
  textSubtle: '#e0e0e0',
  textMuted: '#9e9e9e',
  textOnAccent: '#ffffff',

  // Accent - Fjellhammer green (lighter for dark mode)
  accentSubtle: '#1b3d2a',
  accentBase: '#00C46A',
  accentHover: '#00e07a',
  accentActive: '#009B3E',
  accentText: '#00C46A',

  // Status farger
  successSubtle: '#1b3d2a',
  successBase: '#66bb6a',
  successText: '#81c784',

  warningSubtle: '#3d3020',
  warningBase: '#ffb74d',
  warningText: '#ffc107',

  dangerSubtle: '#3d2020',
  dangerBase: '#ef5350',
  dangerText: '#e57373',

  focusRing: '#00C46A',

  // Palette - lighter for dark mode
  'palette-1': '#00C46A', // Fjellhammer green
  'palette-2': '#64b5f6', // Blue
  'palette-3': '#f06292', // Pink
  'palette-4': '#ffca28', // Amber
  'palette-5': '#ba68c8', // Purple
  'palette-6': '#4dd0e1', // Cyan
  'palette-7': '#ffb74d', // Orange
  'palette-8': '#81c784', // Green
  'palette-9': '#9e9e9e', // Gray
}

export const fjellhammerMaterialLightTheme: Theme = {
  id: 'fjellhammer-light',
  name: 'Fjellhammer Lys',
  colorScheme: 'light',
  colors: fjellhammerMaterialLightColors,
  typography: materialTypography,
  borders: materialBorders,
  shadows: materialLightShadows,
  spacing: materialSpacing,
  logo: {
    light: '/fjellhammer-logo.svg',
    dark: '/fjellhammer-logo.svg',
  },
  navbar: lightNavbar,
}

export const fjellhammerMaterialDarkTheme: Theme = {
  id: 'fjellhammer-material-dark',
  name: 'Fjellhammer Material Mørk',
  colorScheme: 'dark',
  colors: fjellhammerMaterialDarkColors,
  typography: materialTypography,
  borders: materialBorders,
  shadows: materialDarkShadows,
  spacing: materialSpacing,
  logo: {
    light: '/fjellhammer-logo.svg',
    dark: '/fjellhammer-logo.svg',
  },
  navbar: darkNavbar,
}

import type { Theme, ThemeColors, ThemeTypography, ThemeBorders, ThemeShadows, ThemeSpacing, ThemeNavbar } from './ThemeDefinitions'

const fjellhammerFonts = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

const fjellhammerTypography: ThemeTypography = {
  fontFamily: fjellhammerFonts,
  fontFamilyHeading: fjellhammerFonts,
  fontSizeBase: '16px',
  fontWeightNormal: '400',
  fontWeightMedium: '500',
  fontWeightBold: '700',
  lineHeightNormal: '1.6',
  letterSpacing: '0.01em',
}

const fjellhammerBorders: ThemeBorders = {
  radiusNone: '0',
  radiusSm: '2px',
  radiusMd: '4px',
  radiusLg: '6px',
  radiusXl: '8px',
  radiusFull: '9999px',
  widthDefault: '1px',
  widthStrong: '2px',
}

const fjellhammerDarkShadows: ThemeShadows = {
  none: 'none',
  sm: '0 1px 3px rgba(0, 0, 0, 0.3)',
  md: '0 4px 16px rgba(0, 0, 0, 0.4)',
  lg: '0 8px 32px rgba(0, 0, 0, 0.5)',
  xl: '0 16px 48px rgba(0, 0, 0, 0.6)',
}

const fjellhammerLightShadows: ThemeShadows = {
  none: 'none',
  sm: '0 1px 3px rgba(0, 155, 62, 0.08)',
  md: '0 4px 16px rgba(0, 155, 62, 0.10)',
  lg: '0 8px 32px rgba(0, 155, 62, 0.12)',
  xl: '0 16px 48px rgba(0, 155, 62, 0.16)',
}

const fjellhammerSpacing: ThemeSpacing = { scale: 1 }

const fjellhammerDarkNavbar: ThemeNavbar = {
  background: '#031a10',
  textColor: '#f6fff8',
  textColorMuted: '#a7c0b3',
  activeIndicator: 'underline',
  activeColor: '#009B3E',
  borderRadius: '0',
  fullWidth: true,
  logoHeight: 'h-10 md:h-16',
  logoTextAlign: 'items-center',
  logoTextSize: 'text-xl md:text-2xl',
  logoGap: 'gap-4 md:gap-8',
  height: 'h-16',
  heightMd: 'h-20',
}

const fjellhammerLightNavbar: ThemeNavbar = {
  background: '#ffffff',
  textColor: '#052e1a',
  textColorMuted: '#4a6b5a',
  activeIndicator: 'underline',
  activeColor: '#009B3E',
  borderRadius: '0',
  fullWidth: true,
  logoHeight: 'h-10 md:h-16',
  logoTextAlign: 'items-center',
  logoTextSize: 'text-xl md:text-2xl',
  logoGap: 'gap-4 md:gap-8',
  height: 'h-16',
  heightMd: 'h-20',
}

// Fjellhammer Dark Colors - grønn-basert mørkt tema
const fjellhammerDarkColors: ThemeColors = {
  // Bakgrunn - veldig mørk grønn
  backgroundDefault: '#020b05',
  backgroundSubtle: '#031a10',
  backgroundMuted: '#052e1a',

  // Overflater
  surfaceDefault: '#031a10',
  surfaceRaised: '#052e1a',
  surfaceHover: '#074020',
  surfaceActive: '#095228',

  // Kanter
  borderSubtle: '#0a5c2d',
  borderDefault: '#0c7538',
  borderStrong: '#009B3E',

  // Tekst - lys på mørk bakgrunn
  textDefault: '#f6fff8',
  textSubtle: '#c8e6d0',
  textMuted: '#a7c0b3',
  textOnAccent: '#020b05',

  // Accent - Fjellhammer grønn
  accentSubtle: '#052e1a',
  accentBase: '#009B3E',
  accentHover: '#00C46A',
  accentActive: '#00652B',
  accentText: '#00C46A',

  // Status farger
  successSubtle: '#0d2a1a',
  successBase: '#4cd080',
  successText: '#6be0a0',

  warningSubtle: '#2e2510',
  warningBase: '#ffb84d',
  warningText: '#ffc966',

  dangerSubtle: '#2e1a1a',
  dangerBase: '#ff6b6b',
  dangerText: '#ff8a8a',

  focusRing: '#009B3E',

  // Palette - komplementære farger for dark mode
  'palette-1': '#00c46a',  // Fjellhammer grønn (lys)
  'palette-2': '#60a5fa',  // Blå - komplementær
  'palette-3': '#f472b6',  // Rosa - aksent
  'palette-4': '#fbbf24',  // Amber - varme
  'palette-5': '#a78bfa',  // Lilla - kontrast
  'palette-6': '#22d3ee',  // Cyan - frisk
  'palette-7': '#fb923c',  // Orange - energi
  'palette-8': '#34d399',  // Emerald - natur
  'palette-9': '#9ca3af',  // Grå - nøytral
}

// Fjellhammer Light Colors - lyst tema med grønne aksenter
const fjellhammerLightColors: ThemeColors = {
  // Bakgrunn - hvit/lys
  backgroundDefault: '#ffffff',
  backgroundSubtle: '#f0f9f4',
  backgroundMuted: '#e0f2e8',

  // Overflater
  surfaceDefault: '#ffffff',
  surfaceRaised: '#ffffff',
  surfaceHover: '#f5fbf8',
  surfaceActive: '#e8f5ed',

  // Kanter
  borderSubtle: '#c8e6d0',
  borderDefault: '#a7c0b3',
  borderStrong: '#009B3E',

  // Tekst - mørk på lys bakgrunn
  textDefault: '#052e1a',
  textSubtle: '#1a4d2e',
  textMuted: '#4a6b5a',
  textOnAccent: '#ffffff',

  // Accent - Fjellhammer grønn
  accentSubtle: '#e0f2e8',
  accentBase: '#009B3E',
  accentHover: '#00652B',
  accentActive: '#004d20',
  accentText: '#009B3E',

  // Status farger
  successSubtle: '#e6f4ef',
  successBase: '#168736',
  successText: '#0e5c24',

  warningSubtle: '#fff4e6',
  warningBase: '#ff9e1b',
  warningText: '#b36b00',

  dangerSubtle: '#fce8e8',
  dangerBase: '#da291c',
  dangerText: '#a31d14',

  focusRing: '#009B3E',

  // Palette - komplementære farger for light mode
  'palette-1': '#009B3E',  // Fjellhammer grønn
  'palette-2': '#2563EB',  // Blå - komplementær
  'palette-3': '#DB2777',  // Rosa - aksent
  'palette-4': '#D97706',  // Amber - varme
  'palette-5': '#7C3AED',  // Lilla - kontrast
  'palette-6': '#0891B2',  // Cyan - frisk
  'palette-7': '#EA580C',  // Orange - energi
  'palette-8': '#059669',  // Emerald - natur
  'palette-9': '#6B7280',  // Grå - nøytral
}

export const fjellhammerDarkTheme: Theme = {
  id: 'fjellhammer-dark',
  name: 'Fjellhammer Mørk',
  colorScheme: 'dark',
  colors: fjellhammerDarkColors,
  typography: fjellhammerTypography,
  borders: fjellhammerBorders,
  shadows: fjellhammerDarkShadows,
  spacing: fjellhammerSpacing,
  logo: {
    light: '/fjellhammer-logo.svg',
    dark: '/fjellhammer-logo.svg',
  },
  navbar: fjellhammerDarkNavbar,
}

export const fjellhammerLightTheme: Theme = {
  id: 'fjellhammer-light',
  name: 'Fjellhammer Lys',
  colorScheme: 'light',
  colors: fjellhammerLightColors,
  typography: fjellhammerTypography,
  borders: fjellhammerBorders,
  shadows: fjellhammerLightShadows,
  spacing: fjellhammerSpacing,
  logo: {
    light: '/fjellhammer-logo.svg',
    dark: '/fjellhammer-logo.svg',
  },
  navbar: fjellhammerLightNavbar,
}

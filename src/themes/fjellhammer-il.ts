import type { Theme, ThemeColors, ThemeTypography, ThemeBorders, ThemeShadows, ThemeSpacing, ThemeNavbar } from './ThemeDefinitions'

const fjellhammerILFonts = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

const fjellhammerILTypography: ThemeTypography = {
  fontFamily: fjellhammerILFonts,
  fontFamilyHeading: fjellhammerILFonts,
  fontSizeBase: '16px',
  fontWeightNormal: '400',
  fontWeightMedium: '500',
  fontWeightBold: '700',
  lineHeightNormal: '1.6',
  letterSpacing: '0.01em',
}

const fjellhammerILBorders: ThemeBorders = {
  radiusNone: '0',
  radiusSm: '4px',
  radiusMd: '6px',
  radiusLg: '8px',
  radiusXl: '12px',
  radiusFull: '9999px',
  widthDefault: '1px',
  widthStrong: '2px',
}

const fjellhammerILShadows: ThemeShadows = {
  none: 'none',
  sm: '0 1px 3px rgba(0, 0, 0, 0.25)',
  md: '0 4px 12px rgba(0, 0, 0, 0.35)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.45)',
  xl: '0 16px 40px rgba(0, 0, 0, 0.55)',
}

const fjellhammerILSpacing: ThemeSpacing = { scale: 1 }

const fjellhammerILNavbar: ThemeNavbar = {
  background: '#1a1a1a',
  textColor: '#ffffff',
  textColorMuted: '#9ca3af',
  activeIndicator: 'underline',
  activeColor: '#00a651',
  borderRadius: '0',
  fullWidth: true,
  logoHeight: 'h-10 md:h-16',
  logoTextAlign: 'items-center',
  logoTextSize: 'text-xl md:text-2xl',
  logoGap: 'gap-4 md:gap-8',
  height: 'h-16',
  heightMd: 'h-20',
}

// Fjellhammer IL Colors - basert på fjellhammer.no
// Nøytral mørk grå bakgrunn med grønn aksent og gule highlights
const fjellhammerILColors: ThemeColors = {
  // Bakgrunn - nøytral koksgrå (som på nettsiden)
  backgroundDefault: '#121212',
  backgroundSubtle: '#1a1a1a',
  backgroundMuted: '#242424',

  // Overflater - mørk grå
  surfaceDefault: '#1a1a1a',
  surfaceRaised: '#2a2a2a',
  surfaceHover: '#333333',
  surfaceActive: '#3d3d3d',

  // Kanter - grå toner
  borderSubtle: '#333333',
  borderDefault: '#444444',
  borderStrong: '#00a651',

  // Tekst - hvit på mørk bakgrunn
  textDefault: '#ffffff',
  textSubtle: '#e5e5e5',
  textMuted: '#9ca3af',
  textOnAccent: '#ffffff',

  // Accent - Fjellhammer grønn (fra nettsiden)
  accentSubtle: '#0d3320',
  accentBase: '#00a651',
  accentHover: '#00c462',
  accentActive: '#008c44',
  accentText: '#00c462',

  // Status farger
  successSubtle: '#0d3320',
  successBase: '#00a651',
  successText: '#4ade80',

  warningSubtle: '#3d3117',
  warningBase: '#ffc107',
  warningText: '#ffd54f',

  dangerSubtle: '#3d1717',
  dangerBase: '#ef4444',
  dangerText: '#f87171',

  focusRing: '#00a651',

  // Palette - grønn gradient fra fjellhammer.no
  'palette-1': '#00c462',  // Fjellhammer grønn (lys)
  'palette-2': '#2d6a4f',  // Mørk skogsgrønn
  'palette-3': '#40916c',  // Medium grønn
  'palette-4': '#ffc107',  // Gul (som på nettsiden)
  'palette-5': '#52b788',  // Frisk grønn
  'palette-6': '#74c69d',  // Lys grønn
  'palette-7': '#95d5b2',  // Mint grønn
  'palette-8': '#34d399',  // Emerald
  'palette-9': '#9ca3af',  // Grå
}

export const fjellhammerILTheme: Theme = {
  id: 'fjellhammer-il',
  name: 'Fjellhammer IL',
  colorScheme: 'dark',
  colors: fjellhammerILColors,
  typography: fjellhammerILTypography,
  borders: fjellhammerILBorders,
  shadows: fjellhammerILShadows,
  spacing: fjellhammerILSpacing,
  logo: {
    light: '/fjellhammer-logo.svg',
    dark: '/fjellhammer-logo.svg',
  },
  navbar: fjellhammerILNavbar,
}

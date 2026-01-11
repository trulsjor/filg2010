import type {
  Theme,
  ThemeColors,
  ThemeTypography,
  ThemeBorders,
  ThemeShadows,
  ThemeSpacing,
  ThemeNavbar,
} from './ThemeDefinitions'

const handballFonts = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

const handballTypography: ThemeTypography = {
  fontFamily: handballFonts,
  fontFamilyHeading: handballFonts,
  fontSizeBase: '16px',
  fontWeightNormal: '400',
  fontWeightMedium: '500',
  fontWeightBold: '700',
  lineHeightNormal: '1.6',
  letterSpacing: '0.01em',
}

const handballBorders: ThemeBorders = {
  radiusNone: '0',
  radiusSm: '2px',
  radiusMd: '4px',
  radiusLg: '6px',
  radiusXl: '8px',
  radiusFull: '9999px',
  widthDefault: '1px',
  widthStrong: '2px',
}

const handballShadows: ThemeShadows = {
  none: 'none',
  sm: '0 1px 3px rgba(0, 66, 174, 0.08)',
  md: '0 4px 16px rgba(0, 66, 174, 0.10)',
  lg: '0 8px 32px rgba(0, 66, 174, 0.12)',
  xl: '0 16px 48px rgba(0, 66, 174, 0.16)',
}

const handballSpacing: ThemeSpacing = { scale: 1 }

const handballNavbar: ThemeNavbar = {
  background: '#001e5f',
  textColor: '#ffffff',
  textColorMuted: '#a8c4f0',
  activeIndicator: 'underline',
  activeColor: '#ffffff',
  borderRadius: '0',
  fullWidth: true,
  logoHeight: 'h-10 md:h-16',
  logoTextAlign: 'items-center',
  logoTextSize: 'text-xl md:text-2xl',
  logoGap: 'gap-4 md:gap-8',
  height: 'h-16',
  heightMd: 'h-20',
}

// handball.no Light Theme - basert på handball.no farger
const handballColors: ThemeColors = {
  // Bakgrunn - lys grå som handball.no
  backgroundDefault: '#f0f0f0',
  backgroundSubtle: '#e8e8e8',
  backgroundMuted: '#d8d8d8',

  // Overflater - hvit
  surfaceDefault: '#ffffff',
  surfaceRaised: '#ffffff',
  surfaceHover: '#f8f8f8',
  surfaceActive: '#f0f0f0',

  // Kanter
  borderSubtle: '#d0d0d0',
  borderDefault: '#b0b0b0',
  borderStrong: '#001e5f',

  // Tekst
  textDefault: '#1a1a1a',
  textSubtle: '#404040',
  textMuted: '#707070',
  textOnAccent: '#ffffff',

  // Accent - NHF blå (primærknapper)
  accentSubtle: '#e6eef9',
  accentBase: '#001e5f',
  accentHover: '#002a7a',
  accentActive: '#001545',
  accentText: '#001e5f',

  // Status farger - seier = blå (NHF), ikke grønn
  successSubtle: '#e6eef9',
  successBase: '#001e5f',
  successText: '#001e5f',

  warningSubtle: '#fff4e6',
  warningBase: '#ff9e1b',
  warningText: '#b36b00',

  // Rød - NHF rød
  dangerSubtle: '#fce8e8',
  dangerBase: '#c41e3a',
  dangerText: '#9a1830',

  focusRing: '#f53241',

  // Palette - NHF blå og rød
  'palette-1': '#001e5f', // NHF mørk blå
  'palette-2': '#d42a38', // NHF mørk rød (hover for tabell/kart)
  'palette-3': '#f53241', // NHF rød (Tabell/Kart-knapper)
  'palette-4': '#001e5f', // NHF blå
  'palette-5': '#002a7a', // NHF mellomblå
  'palette-6': '#0042ae', // Lys blå
  'palette-7': '#f53241', // NHF rød
  'palette-8': '#001e5f', // NHF blå
  'palette-9': '#6B7280', // Grå
}

export const handballTheme: Theme = {
  id: 'nhf',
  name: 'NHF',
  colorScheme: 'light',
  colors: handballColors,
  typography: handballTypography,
  borders: handballBorders,
  shadows: handballShadows,
  spacing: handballSpacing,
  logo: {
    light: '/fjellhammer-logo.svg',
    dark: '/fjellhammer-logo.svg',
  },
  navbar: handballNavbar,
}

export type ColorScheme = 'light' | 'dark'

export interface ThemeColors {
  backgroundDefault: string
  backgroundSubtle: string
  backgroundMuted: string

  surfaceDefault: string
  surfaceRaised: string
  surfaceHover: string
  surfaceActive: string

  borderSubtle: string
  borderDefault: string
  borderStrong: string

  textDefault: string
  textSubtle: string
  textMuted: string
  textOnAccent: string

  accentSubtle: string
  accentBase: string
  accentHover: string
  accentActive: string
  accentText: string

  successSubtle: string
  successBase: string
  successText: string

  warningSubtle: string
  warningBase: string
  warningText: string

  dangerSubtle: string
  dangerBase: string
  dangerText: string

  focusRing: string

  'palette-1': string
  'palette-2': string
  'palette-3': string
  'palette-4': string
  'palette-5': string
  'palette-6': string
  'palette-7': string
  'palette-8': string
  'palette-9': string
}

export interface ThemeTypography {
  fontFamily: string
  fontFamilyHeading: string
  fontSizeBase: string
  fontWeightNormal: string
  fontWeightMedium: string
  fontWeightBold: string
  lineHeightNormal: string
  letterSpacing: string
}

export interface ThemeBorders {
  radiusNone: string
  radiusSm: string
  radiusMd: string
  radiusLg: string
  radiusXl: string
  radiusFull: string
  widthDefault: string
  widthStrong: string
}

export interface ThemeShadows {
  none: string
  sm: string
  md: string
  lg: string
  xl: string
}

export interface ThemeSpacing {
  scale: number
}

export interface ThemeNavbar {
  background: string
  textColor: string
  textColorMuted: string
  activeIndicator: 'underline' | 'background'
  activeColor: string
  borderRadius: string
  fullWidth: boolean
  logoHeight?: string
  logoGap?: string
  logoTextSize?: string
  logoTextAlign?: 'items-center' | 'items-end' | 'items-start'
  height?: string
  heightMd?: string
}

export interface Theme {
  id: string
  name: string
  colorScheme: ColorScheme
  colors: ThemeColors
  typography: ThemeTypography
  borders: ThemeBorders
  shadows: ThemeShadows
  spacing: ThemeSpacing
  logo?: {
    light: string
    dark: string
  }
  navbar?: ThemeNavbar
}

export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

const DEFAULT_NAVBAR: ThemeNavbar = {
  background: 'var(--ds-color-surface-default)',
  textColor: 'var(--ds-color-text-subtle)',
  textColorMuted: 'var(--ds-color-text-muted)',
  activeIndicator: 'background',
  activeColor: 'var(--ds-color-accent-base)',
  borderRadius: 'var(--ds-radius-xl)',
  fullWidth: false,
}

function applyColors(root: HTMLElement, colors: ThemeColors): void {
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--ds-color-${camelToKebab(key)}`, value)
  })
}

function applyTypography(root: HTMLElement, typography: ThemeTypography): void {
  root.style.setProperty('--ds-font-family', typography.fontFamily)
  root.style.setProperty('--ds-font-family-heading', typography.fontFamilyHeading)
  root.style.setProperty('--ds-font-size-base', typography.fontSizeBase)
  root.style.setProperty('--ds-font-weight-normal', typography.fontWeightNormal)
  root.style.setProperty('--ds-font-weight-medium', typography.fontWeightMedium)
  root.style.setProperty('--ds-font-weight-bold', typography.fontWeightBold)
  root.style.setProperty('--ds-line-height-normal', typography.lineHeightNormal)
  root.style.setProperty('--ds-letter-spacing', typography.letterSpacing)
}

function applyBorders(root: HTMLElement, borders: ThemeBorders): void {
  root.style.setProperty('--ds-radius-none', borders.radiusNone)
  root.style.setProperty('--ds-radius-sm', borders.radiusSm)
  root.style.setProperty('--ds-radius-md', borders.radiusMd)
  root.style.setProperty('--ds-radius-lg', borders.radiusLg)
  root.style.setProperty('--ds-radius-xl', borders.radiusXl)
  root.style.setProperty('--ds-radius-full', borders.radiusFull)
  root.style.setProperty('--ds-border-width-default', borders.widthDefault)
  root.style.setProperty('--ds-border-width-strong', borders.widthStrong)
}

function applyShadows(root: HTMLElement, shadows: ThemeShadows): void {
  root.style.setProperty('--ds-shadow-none', shadows.none)
  root.style.setProperty('--ds-shadow-sm', shadows.sm)
  root.style.setProperty('--ds-shadow-md', shadows.md)
  root.style.setProperty('--ds-shadow-lg', shadows.lg)
  root.style.setProperty('--ds-shadow-xl', shadows.xl)
}

function applyNavbar(root: HTMLElement, navbar: ThemeNavbar): void {
  root.style.setProperty('--ds-navbar-background', navbar.background)
  root.style.setProperty('--ds-navbar-text-color', navbar.textColor)
  root.style.setProperty('--ds-navbar-text-color-muted', navbar.textColorMuted)
  root.style.setProperty('--ds-navbar-active-color', navbar.activeColor)
  root.style.setProperty('--ds-navbar-border-radius', navbar.borderRadius)
  root.setAttribute('data-navbar-active-indicator', navbar.activeIndicator)
  root.setAttribute('data-navbar-full-width', String(navbar.fullWidth))
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement

  root.setAttribute('data-theme', theme.id)
  root.setAttribute('data-color-scheme', theme.colorScheme)

  applyColors(root, theme.colors)
  applyTypography(root, theme.typography)
  applyBorders(root, theme.borders)
  applyShadows(root, theme.shadows)
  root.style.setProperty('--ds-spacing-scale', String(theme.spacing.scale))
  applyNavbar(root, { ...DEFAULT_NAVBAR, ...theme.navbar })
}

import { describe, it, expect, afterEach } from 'vitest'
import { camelToKebab, applyTheme } from './ThemeDefinitions'
import type { Theme } from './ThemeDefinitions'

describe('camelToKebab', () => {
  it('converts camelCase to kebab-case', () => {
    expect(camelToKebab('backgroundDefault')).toBe('background-default')
    expect(camelToKebab('textOnAccent')).toBe('text-on-accent')
    expect(camelToKebab('borderSubtle')).toBe('border-subtle')
  })

  it('handles single word', () => {
    expect(camelToKebab('text')).toBe('text')
  })

  it('handles numbers in string', () => {
    expect(camelToKebab('palette1')).toBe('palette1')
  })
})

describe('applyTheme', () => {
  afterEach(() => {
    // Clean up styles
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-color-scheme')
  })

  const mockTheme: Theme = {
    id: 'fjellhammer-dark',
    name: 'Fjellhammer Mørk',
    colorScheme: 'dark',
    colors: {
      backgroundDefault: '#020b05',
      backgroundSubtle: '#031a10',
      backgroundMuted: '#052e1a',
      surfaceDefault: '#031a10',
      surfaceRaised: '#052e1a',
      surfaceHover: '#074020',
      surfaceActive: '#095228',
      borderSubtle: '#0a5c2d',
      borderDefault: '#0c7538',
      borderStrong: '#009B3E',
      textDefault: '#f6fff8',
      textSubtle: '#c8e6d0',
      textMuted: '#a7c0b3',
      textOnAccent: '#020b05',
      accentSubtle: '#052e1a',
      accentBase: '#009B3E',
      accentHover: '#00C46A',
      accentActive: '#00652B',
      accentText: '#00C46A',
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
      'palette-1': '#009B3E',
      'palette-2': '#00C46A',
      'palette-3': '#00652B',
      'palette-4': '#fbbf24',
      'palette-5': '#059669',
      'palette-6': '#3b82f6',
      'palette-7': '#9a9aa6',
      'palette-8': '#707080',
      'palette-9': '#505060',
    },
    typography: {
      fontFamily: "'Inter', sans-serif",
      fontFamilyHeading: "'Inter', sans-serif",
      fontSizeBase: '16px',
      fontWeightNormal: '400',
      fontWeightMedium: '500',
      fontWeightBold: '700',
      lineHeightNormal: '1.6',
      letterSpacing: '0.01em',
    },
    borders: {
      radiusNone: '0',
      radiusSm: '4px',
      radiusMd: '8px',
      radiusLg: '12px',
      radiusXl: '16px',
      radiusFull: '9999px',
      widthDefault: '1px',
      widthStrong: '2px',
    },
    shadows: {
      none: 'none',
      sm: '0 1px 3px rgba(0, 0, 0, 0.3)',
      md: '0 4px 16px rgba(0, 0, 0, 0.4)',
      lg: '0 8px 32px rgba(0, 0, 0, 0.5)',
      xl: '0 16px 48px rgba(0, 0, 0, 0.6)',
    },
    spacing: { scale: 1 },
  }

  it('sets data-theme attribute', () => {
    applyTheme(mockTheme)
    expect(document.documentElement.getAttribute('data-theme')).toBe('fjellhammer-dark')
  })

  it('sets data-color-scheme attribute', () => {
    applyTheme(mockTheme)
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('dark')
  })

  it('applies color CSS variables', () => {
    applyTheme(mockTheme)
    const style = document.documentElement.style
    expect(style.getPropertyValue('--ds-color-background-default')).toBe('#020b05')
    expect(style.getPropertyValue('--ds-color-accent-base')).toBe('#009B3E')
    expect(style.getPropertyValue('--ds-color-text-default')).toBe('#f6fff8')
  })

  it('applies typography CSS variables', () => {
    applyTheme(mockTheme)
    const style = document.documentElement.style
    expect(style.getPropertyValue('--ds-font-family')).toBe("'Inter', sans-serif")
    expect(style.getPropertyValue('--ds-font-size-base')).toBe('16px')
    expect(style.getPropertyValue('--ds-font-weight-bold')).toBe('700')
  })

  it('applies border CSS variables', () => {
    applyTheme(mockTheme)
    const style = document.documentElement.style
    expect(style.getPropertyValue('--ds-radius-md')).toBe('8px')
    expect(style.getPropertyValue('--ds-border-width-default')).toBe('1px')
  })

  it('applies shadow CSS variables', () => {
    applyTheme(mockTheme)
    const style = document.documentElement.style
    expect(style.getPropertyValue('--ds-shadow-md')).toBe('0 4px 16px rgba(0, 0, 0, 0.4)')
  })

  it('applies spacing scale CSS variable', () => {
    applyTheme(mockTheme)
    const style = document.documentElement.style
    expect(style.getPropertyValue('--ds-spacing-scale')).toBe('1')
  })
})

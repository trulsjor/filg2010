import { describe, it, expect } from 'vitest'
import { fjellhammerDarkTheme, fjellhammerLightTheme } from './fjellhammer'

describe('fjellhammerDarkTheme', () => {
  it('has correct id and name', () => {
    expect(fjellhammerDarkTheme.id).toBe('fjellhammer-dark')
    expect(fjellhammerDarkTheme.name).toBe('Fjellhammer Mørk')
    expect(fjellhammerDarkTheme.colorScheme).toBe('dark')
  })

  it('uses Fjellhammer green as accent color', () => {
    expect(fjellhammerDarkTheme.colors.accentBase).toBe('#009B3E')
  })

  it('has dark background colors', () => {
    expect(fjellhammerDarkTheme.colors.backgroundDefault).toBe('#020b05')
    expect(fjellhammerDarkTheme.colors.backgroundSubtle).toBe('#031a10')
  })

  it('has light text colors for dark mode', () => {
    expect(fjellhammerDarkTheme.colors.textDefault).toBe('#f6fff8')
  })

  it('has success/warning/danger colors', () => {
    expect(fjellhammerDarkTheme.colors.successBase).toBeDefined()
    expect(fjellhammerDarkTheme.colors.warningBase).toBeDefined()
    expect(fjellhammerDarkTheme.colors.dangerBase).toBeDefined()
  })

  it('has typography settings', () => {
    expect(fjellhammerDarkTheme.typography.fontFamily).toContain('Inter')
    expect(fjellhammerDarkTheme.typography.fontSizeBase).toBe('16px')
  })

  it('has border radius settings', () => {
    expect(fjellhammerDarkTheme.borders.radiusMd).toBe('8px')
    expect(fjellhammerDarkTheme.borders.radiusLg).toBe('12px')
  })

  it('has shadow settings', () => {
    expect(fjellhammerDarkTheme.shadows.md).toContain('rgba')
  })

  it('has complementary colors in palette', () => {
    // Komplementære farger for visuell variasjon
    expect(fjellhammerDarkTheme.colors['palette-4']).toBe('#fbbf24') // amber
    expect(fjellhammerDarkTheme.colors['palette-5']).toBe('#a78bfa') // lilla
  })
})

describe('fjellhammerLightTheme', () => {
  it('has correct id and name', () => {
    expect(fjellhammerLightTheme.id).toBe('fjellhammer-light')
    expect(fjellhammerLightTheme.name).toBe('Fjellhammer Lys')
    expect(fjellhammerLightTheme.colorScheme).toBe('light')
  })

  it('uses same accent color as dark theme', () => {
    expect(fjellhammerLightTheme.colors.accentBase).toBe('#009B3E')
  })

  it('has light background colors', () => {
    expect(fjellhammerLightTheme.colors.backgroundDefault).toBe('#ffffff')
  })

  it('has dark text colors for light mode', () => {
    expect(fjellhammerLightTheme.colors.textDefault).toBe('#052e1a')
  })

  it('shares typography with dark theme', () => {
    expect(fjellhammerLightTheme.typography).toEqual(fjellhammerDarkTheme.typography)
  })

  it('shares borders with dark theme', () => {
    expect(fjellhammerLightTheme.borders).toEqual(fjellhammerDarkTheme.borders)
  })
})

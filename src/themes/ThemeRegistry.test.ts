import { describe, it, expect } from 'vitest'
import { themes, getTheme, getThemeOptions, DEFAULT_THEME_ID } from './ThemeRegistry'

describe('ThemeRegistry', () => {
  it('exports all themes', () => {
    expect(themes['fjellhammer-dark']).toBeDefined()
    expect(themes['fjellhammer-light']).toBeDefined()
    expect(themes['fjellhammer-il']).toBeDefined()
    expect(themes['fjellhammer-material-light']).toBeDefined()
    expect(themes['fjellhammer-material-dark']).toBeDefined()
    expect(themes['forest']).toBeDefined()
    expect(themes['showcase']).toBeDefined()
    expect(themes['elevated']).toBeDefined()
    expect(themes['material']).toBeDefined()
  })

  it('has correct default theme id', () => {
    expect(DEFAULT_THEME_ID).toBe('fjellhammer-dark')
  })

  describe('getTheme', () => {
    it('returns correct theme by id', () => {
      const theme = getTheme('fjellhammer-dark')
      expect(theme.id).toBe('fjellhammer-dark')
      expect(theme.name).toBe('Fjellhammer Mørk')
    })

    it('returns light theme by id', () => {
      const theme = getTheme('fjellhammer-light')
      expect(theme.id).toBe('fjellhammer-light')
      expect(theme.name).toBe('Fjellhammer Lys')
    })
  })

  describe('getThemeOptions', () => {
    it('returns array of theme options', () => {
      const options = getThemeOptions()
      expect(Array.isArray(options)).toBe(true)
      expect(options.length).toBe(9)
    })

    it('each option has value and label', () => {
      const options = getThemeOptions()
      options.forEach((option) => {
        expect(option.value).toBeDefined()
        expect(option.label).toBeDefined()
      })
    })

    it('includes Fjellhammer themes', () => {
      const options = getThemeOptions()
      const values = options.map((o) => o.value)
      expect(values).toContain('fjellhammer-dark')
      expect(values).toContain('fjellhammer-light')
    })
  })
})

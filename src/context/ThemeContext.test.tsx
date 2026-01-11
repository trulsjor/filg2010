import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { ThemeProvider, useTheme } from './ThemeContext'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    // Clear document attributes
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-color-scheme')
  })

  describe('ThemeProvider', () => {
    it('provides theme context to children', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      await waitFor(() => {
        expect(result.current.theme).toBeDefined()
        expect(result.current.themeId).toBeDefined()
      })
    })

    it('defaults to fjellhammer-il theme', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      await waitFor(() => {
        expect(result.current.themeId).toBe('fjellhammer-il')
        expect(result.current.theme.name).toBe('Fjellhammer IL')
      })
    })

    it('applies theme to document on mount', async () => {
      renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('fjellhammer-il')
        expect(document.documentElement.getAttribute('data-color-scheme')).toBe('dark')
      })
    })

    it('restores theme from localStorage', async () => {
      localStorageMock.setItem('themeId', 'fjellhammer-light')

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      await waitFor(() => {
        expect(result.current.themeId).toBe('fjellhammer-light')
      })
    })
  })

  describe('useTheme', () => {
    it('throws when used outside provider', () => {
      expect(() => {
        renderHook(() => useTheme())
      }).toThrow('useTheme must be used within a ThemeProvider')
    })

    it('allows changing theme', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      await act(async () => {
        result.current.setThemeId('fjellhammer-light')
      })

      await waitFor(() => {
        expect(result.current.themeId).toBe('fjellhammer-light')
        expect(result.current.colorScheme).toBe('light')
      })
    })

    it('persists theme change to localStorage', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      await act(async () => {
        result.current.setThemeId('fjellhammer-light')
      })

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('themeId', 'fjellhammer-light')
      })
    })

    it('provides colorScheme based on current theme', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      await waitFor(() => {
        expect(result.current.colorScheme).toBe('dark')
      })

      await act(async () => {
        result.current.setThemeId('fjellhammer-light')
      })

      await waitFor(() => {
        expect(result.current.colorScheme).toBe('light')
      })
    })
  })
})

import { createContext, useContext, useEffect, useState } from 'react'
import {
  type Theme,
  type ThemeId,
  type ColorScheme,
  getTheme,
  applyTheme,
  DEFAULT_THEME_ID,
  themes,
} from '../themes/ThemeRegistry'

interface ThemeContextType {
  themeId: ThemeId
  theme: Theme
  colorScheme: ColorScheme
  setThemeId: (id: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function isValidThemeId(id: string): id is ThemeId {
  return id in themes
}

function getInitialThemeId(): ThemeId {
  if (typeof window === 'undefined') return DEFAULT_THEME_ID
  const stored = localStorage.getItem('themeId')
  if (stored && isValidThemeId(stored)) {
    return stored
  }
  return DEFAULT_THEME_ID
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(getInitialThemeId)

  const theme = getTheme(themeId)

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem('themeId', themeId)
  }, [theme, themeId])

  const setThemeId = (id: ThemeId) => {
    setThemeIdState(id)
  }

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        theme,
        colorScheme: theme.colorScheme,
        setThemeId,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

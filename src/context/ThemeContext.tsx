import { useEffect, useState } from 'react'
import {
  type ThemeId,
  getTheme,
  applyTheme,
  DEFAULT_THEME_ID,
  themes,
} from '../themes/ThemeRegistry'
import { ThemeContext } from '../hooks/useTheme'

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

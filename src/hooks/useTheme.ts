import { useContext, createContext } from 'react'
import type { Theme, ThemeId, ColorScheme } from '../themes/ThemeRegistry'

export interface ThemeContextType {
  themeId: ThemeId
  theme: Theme
  colorScheme: ColorScheme
  setThemeId: (id: ThemeId) => void
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

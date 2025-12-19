import type { Theme, ThemeId } from './ThemeDefinitions'

export type { Theme, ThemeId, ThemeColors, ThemeTypography, ThemeBorders, ThemeShadows, ThemeSpacing, ColorScheme } from './ThemeDefinitions'
export { applyTheme, camelToKebab } from './ThemeDefinitions'

import { fjellhammerDarkTheme, fjellhammerLightTheme } from './fjellhammer'

export const themes: Record<ThemeId, Theme> = {
  'fjellhammer-dark': fjellhammerDarkTheme,
  'fjellhammer-light': fjellhammerLightTheme,
}

export const DEFAULT_THEME_ID: ThemeId = 'fjellhammer-dark'

export function getTheme(id: ThemeId): Theme {
  return themes[id]
}

export function getThemeOptions(): { value: ThemeId; label: string }[] {
  return Object.values(themes).map((theme) => ({
    value: theme.id,
    label: theme.name,
  }))
}

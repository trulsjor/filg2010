import type { Theme } from './ThemeDefinitions'

export type {
  Theme,
  ThemeColors,
  ThemeTypography,
  ThemeBorders,
  ThemeShadows,
  ThemeSpacing,
  ColorScheme,
} from './ThemeDefinitions'
export { applyTheme, camelToKebab } from './ThemeDefinitions'

import { fjellhammerDarkTheme, fjellhammerLightTheme } from './fjellhammer'
import { fjellhammerILTheme } from './fjellhammer-il'
import { fjellhammerMaterialLightTheme, fjellhammerMaterialDarkTheme } from './fjellhammer-material'
import { showcaseTheme } from './showcase'
import { elevatedTheme } from './elevated'
import { materialTheme } from './material'

/**
 * THEME REGISTRY - Single source of truth for all themes
 *
 * To add a new theme:
 * 1. Create theme file (e.g., src/themes/my-theme.ts)
 * 2. Import it above
 * 3. Add it to this object with a unique key
 *
 * That's it! ThemeId type is auto-generated from this object's keys.
 */
export const themes = {
  'fjellhammer-dark': fjellhammerDarkTheme,
  'fjellhammer-light': fjellhammerLightTheme,
  'fjellhammer-il': fjellhammerILTheme,
  'fjellhammer-material-light': fjellhammerMaterialLightTheme,
  'fjellhammer-material-dark': fjellhammerMaterialDarkTheme,
  showcase: showcaseTheme,
  elevated: elevatedTheme,
  material: materialTheme,
} as const satisfies Record<string, Theme>

// ThemeId is automatically derived from the themes object keys
export type ThemeId = keyof typeof themes

export const DEFAULT_THEME_ID: ThemeId = 'fjellhammer-il'

export function getTheme(id: ThemeId): Theme {
  return themes[id]
}

export function getThemeOptions(): { value: ThemeId; label: string }[] {
  return Object.values(themes).map((theme) => ({
    value: theme.id as ThemeId,
    label: theme.name,
  }))
}

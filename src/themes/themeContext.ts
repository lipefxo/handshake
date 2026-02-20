import { createContext } from 'react';
import { defaultThemeId, themes } from './themeDefinitions';
import type { ThemeDefinition, ThemeId } from './themeTypes';

export interface ThemeContextValue {
  theme: ThemeDefinition;
  themeId: ThemeId;
}

const defaultTheme = themes[defaultThemeId];

export const ThemeContext = createContext<ThemeContextValue>({
  theme: defaultTheme,
  themeId: defaultThemeId,
});

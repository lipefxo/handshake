import {
  useEffect,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { defaultThemeId, resolveBrandTheme, themes } from './themeDefinitions';
import type { ThemeId } from './themeTypes';
import { ThemeContext } from './themeContext';
import type { BrandOverrides } from '../types/proposal';
import type { WorkspaceBrandTheme } from '../types/workspace';

interface ThemeProviderProps {
  themeId: ThemeId;
  children: ReactNode;
  className?: string;
  brandOverrides?: BrandOverrides;
  workspaceBrandTheme?: WorkspaceBrandTheme;
}

export function ThemeProvider({
  themeId,
  children,
  className = '',
  brandOverrides,
  workspaceBrandTheme,
}: ThemeProviderProps) {
  const baseTheme = themes[themeId] ?? themes[defaultThemeId];
  const theme = useMemo(() => {
    if (baseTheme.id !== 'bold-brand') return baseTheme;
    return resolveBrandTheme(workspaceBrandTheme);
  }, [baseTheme, workspaceBrandTheme]);

  useEffect(() => {
    const linkId = `theme-fonts-${theme.id}`;
    if (document.getElementById(linkId)) return;

    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = theme.fonts.googleFontsImport;
    document.head.appendChild(link);
  }, [theme]);

  const cssVars = useMemo(
    () =>
      ({
        '--color-bg-primary': theme.colors.bgPrimary,
        '--color-bg-secondary': theme.colors.bgSecondary,
        '--color-bg-surface': theme.colors.bgSurface,
        '--color-bg-admin': theme.colors.bgAdmin,
        '--color-bg-admin-surface': theme.colors.bgAdminSurface,
        '--color-text-primary': theme.colors.textPrimary,
        '--color-text-secondary': theme.colors.textSecondary,
        '--color-text-tertiary': theme.colors.textTertiary,
        '--color-accent': theme.colors.accent,
        '--color-accent-hover': theme.colors.accentHover,
        '--color-accent-muted': theme.colors.accentMuted,
        '--color-border': theme.colors.border,
        '--color-border-light': theme.colors.borderLight,
        '--color-success': theme.colors.success,
        '--color-error': theme.colors.error,
        '--color-warning': theme.colors.warning,
        '--color-gradient-start': theme.colors.gradientStart,
        '--color-gradient-end': theme.colors.gradientEnd,
        '--color-overlay-bg': theme.colors.overlayBg,
        '--font-display': theme.fonts.display,
        '--font-display-weight': String(theme.fonts.displayWeight),
        '--font-body': theme.fonts.body,
        '--font-body-weight': String(theme.fonts.bodyWeight),
        '--font-mono': theme.fonts.mono,
        '--radius': theme.style.borderRadius,
        '--decorative-opacity': String(theme.style.decorativeOpacity),
        '--text-shadow': theme.style.textShadow ?? 'none',
        ...(brandOverrides?.primaryColor && {
          '--color-bg-primary': brandOverrides.primaryColor,
        }),
        ...(brandOverrides?.accentColor && {
          '--color-accent': brandOverrides.accentColor,
          '--color-accent-hover': brandOverrides.accentColor,
          '--color-accent-muted': brandOverrides.accentColor + '33',
        }),
      }) as CSSProperties,
    [theme, brandOverrides],
  );

  return (
    <ThemeContext.Provider value={{ theme, themeId: theme.id }}>
      <div style={cssVars} className={className}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

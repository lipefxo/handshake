export type ThemeId = 'dark-minimal' | 'light-corporate' | 'bold-brand';

export type ThemeSlideTransition = 'fade' | 'slide-up' | 'slide-left' | 'scale' | 'blur';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  colors: {
    bgPrimary: string;
    bgSecondary: string;
    bgSurface: string;
    bgAdmin: string;
    bgAdminSurface: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    accent: string;
    accentHover: string;
    accentMuted: string;
    border: string;
    borderLight: string;
    success: string;
    error: string;
    warning: string;
    gradientStart: string;
    gradientEnd: string;
    overlayBg: string;
  };
  fonts: {
    display: string;
    displayWeight: number;
    body: string;
    bodyWeight: number;
    mono: string;
    googleFontsImport: string;
  };
  style: {
    borderRadius: string;
    slideTransitionDefault: ThemeSlideTransition;
    decorativeOpacity: number;
    textShadow?: string;
    navDotStyle: 'filled' | 'outline' | 'dash';
  };
}

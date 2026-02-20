import type { BenefitsSlideContent, FeaturesSlideContent, SlideConfig } from '../../types/proposal';
import { isAppIconId, type AppIconId } from './iconRegistry';

const LEGACY_ICON_MAP: Record<string, AppIconId> = {
  '✦': 'slide.type.title',
  '◎': 'slide.type.intro',
  '▲': 'slide.type.stats',
  '⬡': 'slide.type.features',
  '❝': 'slide.type.testimonial',
  '⇄': 'slide.type.comparison',
  '◉': 'slide.type.timeline',
  '▣': 'slide.type.media',
  '★': 'slide.type.benefits',
  '→': 'slide.type.closing',
  '🛡': 'slide.features.protection',
  '🛡️': 'slide.features.protection',
  '🎨': 'slide.features.branding',
  '⚡': 'slide.features.speed',
  '🌱': 'slide.features.sustainability',
  '⭐': 'slide.features.default',
  '✨': 'slide.features.default',
  '💼': 'slide.benefits.account-manager',
  '📦': 'slide.benefits.priority-production',
  '💰': 'slide.benefits.volume-pricing',
  '📊': 'slide.benefits.performance-reports',
  '💎': 'slide.benefits.default',
  '🚀': 'slide.features.speed',
};

export function normalizeIconId(icon: string | undefined, fallbackIcon?: AppIconId): AppIconId | undefined {
  if (!icon && !fallbackIcon) {
    return undefined;
  }

  if (icon && isAppIconId(icon)) {
    return icon;
  }

  if (icon && LEGACY_ICON_MAP[icon]) {
    return LEGACY_ICON_MAP[icon];
  }

  return fallbackIcon;
}

export function normalizeSlidesIconIds(slides: SlideConfig[]): SlideConfig[] {
  return slides.map((slide) => {
    if (slide.type === 'features') {
      const content = slide.content as FeaturesSlideContent;
      return {
        ...slide,
        content: {
          ...content,
          features: content.features.map((feature) => ({
            ...feature,
            icon: normalizeIconId(feature.icon, 'slide.features.default'),
          })),
        },
      };
    }

    if (slide.type === 'benefits') {
      const content = slide.content as BenefitsSlideContent;
      return {
        ...slide,
        content: {
          ...content,
          benefits: content.benefits.map((benefit) => ({
            ...benefit,
            icon: normalizeIconId(benefit.icon, 'slide.benefits.default'),
          })),
        },
      };
    }

    return slide;
  });
}

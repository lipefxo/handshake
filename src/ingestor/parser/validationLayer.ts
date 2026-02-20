import type { SlideConfig, SlideType } from '../../types/proposal';
import type {
  StatsSlideContent,
  FeaturesSlideContent,
  BenefitsSlideContent,
  TestimonialSlideContent,
  TimelineSlideContent,
  ClosingSlideContent,
  MediaSlideContent,
} from '../../types/proposal';

export interface ValidationMessage {
  level: 'warning' | 'error';
  field?: string;
  message: string;
}

export interface ValidationResult {
  slideIndex: number;
  slideType: SlideType;
  status: 'valid' | 'warning' | 'error';
  messages: ValidationMessage[];
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).every(isEmpty);
  return false;
}

export function validateSlides(slides: SlideConfig[]): ValidationResult[] {
  return slides.map((slide, idx) => {
    const messages: ValidationMessage[] = [];

    // Check for completely empty content
    if (isEmpty(slide.content)) {
      messages.push({ level: 'error', message: 'Slide has no content — nothing was extracted.' });
    }

    switch (slide.type) {
      case 'stats': {
        const c = slide.content as StatsSlideContent;
        if (!c.stats || c.stats.length === 0) {
          messages.push({ level: 'error', field: 'stats', message: 'No numeric metrics detected.' });
        } else {
          c.stats.forEach((s, i) => {
            if (s.value === 0 && !s.label) {
              messages.push({ level: 'warning', field: `stats[${i}]`, message: `Stat ${i + 1}: value could not be parsed as a number.` });
            }
            if (!s.label) {
              messages.push({ level: 'warning', field: `stats[${i}].label`, message: `Stat ${i + 1} is missing a label.` });
            }
          });
        }
        break;
      }

      case 'features': {
        const c = slide.content as FeaturesSlideContent;
        (c.features ?? []).forEach((f, i) => {
          if (!f.description) {
            messages.push({ level: 'warning', field: `features[${i}].description`, message: `Feature ${i + 1} "${f.title}" is missing a description.` });
          }
        });
        break;
      }

      case 'benefits': {
        const c = slide.content as BenefitsSlideContent;
        (c.benefits ?? []).forEach((b, i) => {
          if (!b.description) {
            messages.push({ level: 'warning', field: `benefits[${i}].description`, message: `Benefit ${i + 1} "${b.title}" is missing a description.` });
          }
        });
        break;
      }

      case 'testimonial': {
        const c = slide.content as TestimonialSlideContent;
        if (!c.author) {
          messages.push({ level: 'warning', field: 'author', message: 'Testimonial is missing attribution (— Name, Role at Company).' });
        }
        break;
      }

      case 'timeline': {
        const c = slide.content as TimelineSlideContent;
        (c.milestones ?? []).forEach((m, i) => {
          if (!m.description) {
            messages.push({ level: 'warning', field: `milestones[${i}].description`, message: `Milestone ${i + 1} "${m.title}" has no description.` });
          }
        });
        break;
      }

      case 'closing': {
        const c = slide.content as ClosingSlideContent;
        if (!c.contactEmail && !c.contactPhone && !c.ctaUrl) {
          messages.push({ level: 'warning', message: 'Closing slide has no contact info or CTA link.' });
        }
        break;
      }

      case 'media': {
        const c = slide.content as MediaSlideContent;
        if (c.url && !c.url.startsWith('http')) {
          messages.push({ level: 'warning', field: 'url', message: `Image URL "${c.url}" does not start with http — auto-prepending https://.` });
        }
        break;
      }
    }

    const status = messages.some((m) => m.level === 'error')
      ? 'error'
      : messages.length > 0
        ? 'warning'
        : 'valid';

    return { slideIndex: idx, slideType: slide.type, status, messages };
  });
}

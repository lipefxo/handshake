import type { SlideConfig, TitleSlideContent, IntroSlideContent, StatsSlideContent, FeaturesSlideContent, TestimonialSlideContent, ComparisonSlideContent, TimelineSlideContent, MediaSlideContent, BenefitsSlideContent, TableSlideContent, ClosingSlideContent } from '../../types/proposal';
import type { ReactNode } from 'react';
import { TitleSlide } from './slides/TitleSlide';
import { IntroSlide } from './slides/IntroSlide';
import { StatsSlide } from './slides/StatsSlide';
import { FeaturesSlide } from './slides/FeaturesSlide';
import { TestimonialSlide } from './slides/TestimonialSlide';
import { ComparisonSlide } from './slides/ComparisonSlide';
import { TimelineSlide } from './slides/TimelineSlide';
import { MediaSlide } from './slides/MediaSlide';
import { BenefitsSlide } from './slides/BenefitsSlide';
import { TableSlide } from './slides/TableSlide';
import { ClosingSlide } from './slides/ClosingSlide';
import { AppIcon } from '../../shared/icons/AppIcon';
import { sanitizeText, validateUrl } from '../../shared/utils/validation';

interface SlideRendererProps {
  slide: SlideConfig;
  index: number;
  proposalPartnerName?: string;
}

export function SlideRenderer({ slide, proposalPartnerName }: SlideRendererProps) {
  const { type, content } = slide;

  let slideBody: ReactNode;
  switch (type) {
    case 'title':
      slideBody = <TitleSlide content={content as TitleSlideContent} partnerName={proposalPartnerName} />;
      break;
    case 'intro':
      slideBody = <IntroSlide content={content as IntroSlideContent} />;
      break;
    case 'stats':
      slideBody = <StatsSlide content={content as StatsSlideContent} />;
      break;
    case 'features':
      slideBody = <FeaturesSlide content={content as FeaturesSlideContent} />;
      break;
    case 'testimonial':
      slideBody = <TestimonialSlide content={content as TestimonialSlideContent} />;
      break;
    case 'comparison':
      slideBody = <ComparisonSlide content={content as ComparisonSlideContent} />;
      break;
    case 'timeline':
      slideBody = <TimelineSlide content={content as TimelineSlideContent} />;
      break;
    case 'media':
      slideBody = <MediaSlide content={content as MediaSlideContent} />;
      break;
    case 'benefits':
      slideBody = <BenefitsSlide content={content as BenefitsSlideContent} />;
      break;
    case 'table':
      slideBody = <TableSlide content={content as TableSlideContent} />;
      break;
    case 'closing':
      slideBody = <ClosingSlide content={content as ClosingSlideContent} />;
      break;
    default:
      slideBody = (
        <div
          className="flex items-center justify-center w-full h-full"
          style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-tertiary)' }}
        >
          Unknown slide type: {type}
        </div>
      );
  }

  const validLinks = (slide.links ?? []).filter((link) => {
    const text = sanitizeText(link.text ?? '');
    const urlValidation = validateUrl(link.url ?? '');
    return Boolean(text) && urlValidation.isValid;
  });

  return (
    <div className="relative w-full h-full">
      {slideBody}

      {validLinks.length > 0 && (
        <div className="pointer-events-none absolute bottom-8 left-0 right-0 z-30 flex justify-center gap-3 px-6">
          {validLinks.map((link, index) => {
            const text = sanitizeText(link.text ?? '');
            const urlValidation = validateUrl(link.url ?? '');
            if (!text || !urlValidation.isValid) return null;

            return (
              <a
                key={`${urlValidation.value}-${index}`}
                href={urlValidation.value}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105"
                style={{
                  background: 'var(--color-text-primary)',
                  color: 'var(--color-bg-primary)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {text}
                <AppIcon icon="ui.external-link" className="w-3.5 h-3.5" />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

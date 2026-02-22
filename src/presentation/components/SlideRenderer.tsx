import type { SlideConfig, TitleSlideContent, IntroSlideContent, StatsSlideContent, FeaturesSlideContent, TestimonialSlideContent, ComparisonSlideContent, TimelineSlideContent, MediaSlideContent, BenefitsSlideContent, ClosingSlideContent } from '../../types/proposal';
import { TitleSlide } from './slides/TitleSlide';
import { IntroSlide } from './slides/IntroSlide';
import { StatsSlide } from './slides/StatsSlide';
import { FeaturesSlide } from './slides/FeaturesSlide';
import { TestimonialSlide } from './slides/TestimonialSlide';
import { ComparisonSlide } from './slides/ComparisonSlide';
import { TimelineSlide } from './slides/TimelineSlide';
import { MediaSlide } from './slides/MediaSlide';
import { BenefitsSlide } from './slides/BenefitsSlide';
import { ClosingSlide } from './slides/ClosingSlide';

interface SlideRendererProps {
  slide: SlideConfig;
  index: number;
  proposalPartnerName?: string;
}

export function SlideRenderer({ slide, proposalPartnerName }: SlideRendererProps) {
  const { type, content } = slide;

  switch (type) {
    case 'title':
      return <TitleSlide content={content as TitleSlideContent} partnerName={proposalPartnerName} />;
    case 'intro':
      return <IntroSlide content={content as IntroSlideContent} />;
    case 'stats':
      return <StatsSlide content={content as StatsSlideContent} />;
    case 'features':
      return <FeaturesSlide content={content as FeaturesSlideContent} />;
    case 'testimonial':
      return <TestimonialSlide content={content as TestimonialSlideContent} />;
    case 'comparison':
      return <ComparisonSlide content={content as ComparisonSlideContent} />;
    case 'timeline':
      return <TimelineSlide content={content as TimelineSlideContent} />;
    case 'media':
      return <MediaSlide content={content as MediaSlideContent} />;
    case 'benefits':
      return <BenefitsSlide content={content as BenefitsSlideContent} />;
    case 'closing':
      return <ClosingSlide content={content as ClosingSlideContent} />;
    default:
      return (
        <div className="flex items-center justify-center w-full h-full"
          style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-tertiary)' }}>
          Unknown slide type: {type}
        </div>
      );
  }
}

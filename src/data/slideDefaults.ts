import { v4 as uuidv4 } from 'uuid';
import type { ClosingSlideContent, SlideConfig, SlideType, TitleSlideContent } from '../types/proposal';
import type { AppIconId } from '../shared/icons/iconRegistry';
import type { ThemeId } from '../themes/themeTypes';
import { themes } from '../themes/themeDefinitions';

export interface ProposalSeedData {
  title?: string;
  partnerName?: string;
  contactName?: string;
  contactEmail?: string;
  proposalDate?: string;
  themeId?: ThemeId;
}

export const SLIDE_TYPE_META: Record<SlideType, { label: string; icon: AppIconId; description: string }> = {
  title: { label: 'Title', icon: 'slide.type.title', description: 'Hero opening with partner logo & tagline' },
  intro: { label: 'Introduction', icon: 'slide.type.intro', description: 'Who we are or partnership overview' },
  stats: { label: 'Stats & Metrics', icon: 'slide.type.stats', description: 'Animated counters & key metrics' },
  features: { label: 'Features', icon: 'slide.type.features', description: 'Product or service highlights' },
  testimonial: { label: 'Testimonial', icon: 'slide.type.testimonial', description: 'Quote with attribution' },
  comparison: { label: 'Comparison', icon: 'slide.type.comparison', description: 'Before & after or side-by-side' },
  timeline: { label: 'Timeline', icon: 'slide.type.timeline', description: 'Partnership roadmap & milestones' },
  media: { label: 'Media', icon: 'slide.type.media', description: 'Full-bleed image, GIF, or video' },
  benefits: { label: 'Benefits', icon: 'slide.type.benefits', description: 'What the partner gets' },
  table: { label: 'Table', icon: 'slide.type.table', description: 'Structured data in rows & columns' },
  closing: { label: 'Closing & CTA', icon: 'slide.type.closing', description: 'Call to action & contact info' },
};

export function createDefaultSlide(type: SlideType): SlideConfig {
  const defaults: Record<SlideType, SlideConfig['content']> = {
    title: {
      partnerName: 'Partner Company',
      headline: 'A Strategic Partnership',
      subheadline: 'Together, we grow.',
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    },
    intro: {
      heading: 'Who We Are',
      body: 'Acme Corp is a leading provider of premium protective packaging solutions. We partner with world-class brands to deliver exceptional quality and unmatched reliability.',
      imagePosition: 'right',
    },
    stats: {
      heading: 'Our Track Record',
      stats: [
        { value: 500, suffix: '+', label: 'Partner Brands', description: 'Across 40 countries' },
        { value: 98, suffix: '%', label: 'Client Retention', description: 'Year over year' },
        { value: 12, prefix: '$', suffix: 'M', label: 'Revenue Generated', description: 'For our partners in 2024' },
        { value: 4.9, label: 'Average Rating', description: 'On quality & service' },
      ],
    },
    features: {
      heading: 'What We Offer',
      subheading: 'Premium solutions designed for your brand',
      features: [
        { icon: 'slide.features.protection', title: 'Premium Protection', description: 'Military-grade materials that safeguard your products in transit.' },
        { icon: 'slide.features.branding', title: 'Custom Branding', description: 'Full-bleed printing, custom shapes, and bespoke finishes.' },
        { icon: 'slide.features.speed', title: 'Fast Turnaround', description: '5-day standard production with expedited options available.' },
        { icon: 'slide.features.sustainability', title: 'Sustainable Materials', description: '100% recyclable and biodegradable options for eco-conscious brands.' },
      ],
    },
    testimonial: {
      quote: 'Partnering with Acme Corp transformed our unboxing experience. Our customers notice — and they love it.',
      author: 'Sarah Chen',
      role: 'Head of Brand',
      company: 'Acme Corp',
    },
    comparison: {
      heading: 'The Acme Corp Difference',
      before: {
        label: 'Before',
        items: ['Generic packaging', 'Long lead times', 'Limited customization', 'High damage rates'],
      },
      after: {
        label: 'With Acme Corp',
        items: ['On-brand unboxing', '5-day production', 'Full customization', '<0.1% damage rate'],
      },
    },
    timeline: {
      heading: 'Our Partnership Roadmap',
      milestones: [
        { date: 'Month 1', title: 'Onboarding & Design', description: 'Brand audit, custom design concepts, approval.' },
        { date: 'Month 2', title: 'Production & Testing', description: 'First batch production, quality testing, refinement.' },
        { date: 'Month 3', title: 'Launch', description: 'Full rollout with dedicated account management.' },
        { date: 'Ongoing', title: 'Scale & Optimize', description: 'Quarterly reviews, new products, and co-marketing.' },
      ],
    },
    media: {
      mediaType: 'image',
      url: '',
      caption: '',
      fit: 'cover',
    },
    benefits: {
      heading: 'What You Get',
      benefits: [
        { icon: 'slide.benefits.account-manager', title: 'Dedicated Account Manager', description: 'A single point of contact who knows your brand inside out.' },
        { icon: 'slide.benefits.priority-production', title: 'Priority Production', description: 'Jump the queue with guaranteed lead times.' },
        { icon: 'slide.benefits.volume-pricing', title: 'Volume Pricing', description: 'Tiered discounts that grow with your order volume.' },
        { icon: 'slide.benefits.performance-reports', title: 'Performance Reports', description: 'Monthly analytics on packaging performance and ROI.' },
      ],
    },
    table: {
      heading: 'Plan Comparison',
      description: 'A quick view of options and inclusions.',
      columns: ['Plan', 'Monthly', 'Support'],
      rows: [
        ['Starter', '$499', 'Email'],
        ['Growth', '$999', 'Priority email'],
        ['Enterprise', 'Custom', 'Dedicated manager'],
      ],
    },
    closing: {
      heading: "Let's Build Something Great",
      subheading: "We're ready when you are. Reach out to start the conversation.",
      ctaText: 'Schedule a Call',
      ctaUrl: 'https://calendly.com/acme-corp',
      contactName: 'Alex Rivera',
      contactEmail: 'alex@acmecorp.com',
      contactPhone: '+1 (555) 000-0000',
    },
  };

  return {
    id: uuidv4(),
    type,
    enabled: true,
    content: defaults[type],
    transition: 'slide-up',
  };
}

export function createDefaultProposalSlides(seed: ProposalSeedData = {}): SlideConfig[] {
  const themeTransition = seed.themeId ? themes[seed.themeId]?.style.slideTransitionDefault : undefined;
  const slides = [
    createDefaultSlide('title'),
    createDefaultSlide('stats'),
    createDefaultSlide('features'),
    createDefaultSlide('benefits'),
    createDefaultSlide('closing'),
  ];

  return slides.map((slide) => {
    if (slide.type === 'title') {
      const content = slide.content as TitleSlideContent;
      return {
        ...slide,
        content: {
          ...content,
          partnerName: seed.partnerName?.trim() || content.partnerName,
          date: seed.proposalDate || content.date,
          headline: seed.title?.trim() || content.headline,
        },
      };
    }

    if (slide.type === 'closing') {
      const content = slide.content as ClosingSlideContent;
      return {
        ...slide,
        content: {
          ...content,
          contactName: seed.contactName?.trim() || content.contactName,
          contactEmail: seed.contactEmail?.trim() || content.contactEmail,
        },
      };
    }

    return themeTransition ? { ...slide, transition: themeTransition } : slide;
  });
}

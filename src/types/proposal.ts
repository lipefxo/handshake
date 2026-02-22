import type { ThemeId } from '../themes/themeTypes';
import type { AppIconId } from '../shared/icons/iconRegistry';

export type SlideType =
  | 'title'
  | 'intro'
  | 'stats'
  | 'features'
  | 'testimonial'
  | 'comparison'
  | 'timeline'
  | 'media'
  | 'benefits'
  | 'table'
  | 'closing';

export interface SlideLink {
  text: string;
  url: string;
  variant?: 'primary' | 'secondary';
}

export interface SlideConfig {
  id: string;
  type: SlideType;
  enabled: boolean;
  content: SlideContent;
  links?: SlideLink[];
  customLabel?: string;
  groupId?: string;
  groupTitle?: string;
  transition?: 'fade' | 'slide-up' | 'slide-left' | 'scale' | 'blur';
  backgroundOverride?: string;
}

export interface TitleSlideContent {
  partnerName: string;
  partnerLogo?: string;
  secureBagsLogo?: string;
  headline: string;
  subheadline?: string;
  date?: string;
}

export interface IntroSlideContent {
  heading: string;
  body: string;
  image?: string;
  imagePosition?: 'left' | 'right';
}

export interface StatsSlideContent {
  heading?: string;
  stats: Array<{
    value: number;
    suffix?: string;
    prefix?: string;
    label: string;
    description?: string;
  }>;
}

export interface FeaturesSlideContent {
  heading: string;
  subheading?: string;
  features: Array<{
    icon?: AppIconId;
    title: string;
    description: string;
  }>;
}

export interface TestimonialSlideContent {
  quote: string;
  author: string;
  role?: string;
  company?: string;
  avatar?: string;
}

export interface ComparisonSlideContent {
  heading: string;
  before: { label: string; items: string[] };
  after: { label: string; items: string[] };
}

export interface TimelineSlideContent {
  heading: string;
  milestones: Array<{
    date: string;
    title: string;
    description?: string;
  }>;
}

export interface MediaSlideContent {
  mediaType: 'image' | 'gif' | 'video';
  url: string;
  caption?: string;
  fit?: 'cover' | 'contain';
}

export interface BenefitsSlideContent {
  heading: string;
  benefits: Array<{
    icon?: AppIconId;
    title: string;
    description: string;
  }>;
}

export interface TableSlideContent {
  heading: string;
  description?: string;
  columns: string[];
  rows: string[][];
}

export interface ClosingSlideContent {
  heading: string;
  subheading?: string;
  ctaText?: string;
  ctaUrl?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export type SlideContent =
  | TitleSlideContent
  | IntroSlideContent
  | StatsSlideContent
  | FeaturesSlideContent
  | TestimonialSlideContent
  | ComparisonSlideContent
  | TimelineSlideContent
  | MediaSlideContent
  | BenefitsSlideContent
  | TableSlideContent
  | ClosingSlideContent;

export interface BrandOverrides {
  primaryColor?: string;
  accentColor?: string;
  companyLogo?: string;
}

export interface Proposal {
  id: string;
  workspace_id: string;
  slug: string;
  shortCode?: string;
  title: string;
  partnerName: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published';
  slides: SlideConfig[];
  themeId: ThemeId;
  // Sharing
  visibility?: 'public' | 'password' | 'email_gated';
  accessPassword?: string;
  expiresAt?: string;
  // Brand overrides
  brandOverrides?: BrandOverrides;
}

export interface AppUser {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

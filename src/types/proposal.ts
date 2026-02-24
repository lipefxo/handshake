import type { ThemeId } from '../themes/themeTypes';
import type { AppIconId } from '../shared/icons/iconRegistry';
import type { WorkspaceBrandTheme } from './workspace';

export type SlideType =
  | 'title'
  | 'intro'
  | 'stats'
  | 'features'
  | 'bullet-list'
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
  label?: string;
  heading: string;
  body: string;
  image?: string;
  imageEnabled?: boolean;
  imageLayout?: 'constrained' | 'split' | 'full-width-top' | 'full-width-middle' | 'full-width-bottom';
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
  label?: string;
  heading: string;
  subheading?: string;
  features: Array<{
    icon?: AppIconId;
    title: string;
    description: string;
  }>;
}

export interface BulletListSlideContent {
  label?: string;
  heading: string;
  subheading?: string;
  items: string[];
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
  label?: string;
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
  | BulletListSlideContent
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
  companyName?: string;
  showFooterBranding?: boolean;
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
  updatedBy?: string;
  status: 'draft' | 'published';
  slides: SlideConfig[];
  themeId: ThemeId;
  // Sharing
  visibility?: 'public' | 'password' | 'email_gated';
  accessPassword?: string;
  expiresAt?: string;
  // Brand overrides
  brandOverrides?: BrandOverrides;
  workspaceBrandTheme?: WorkspaceBrandTheme;
}

export interface ProposalVersion {
  id: string;
  proposalId: string;
  versionNumber: number;
  title: string;
  partnerName: string;
  slides: SlideConfig[];
  themeId: ThemeId;
  brandOverrides?: BrandOverrides;
  createdBy?: string;
  createdAt: string;
}

export interface ProposalAccessMeta {
  id: string;
  slug: string;
  shortCode?: string;
  title: string;
  partnerName: string;
  status: 'draft' | 'published';
  visibility?: 'public' | 'password' | 'email_gated';
  expiresAt?: string;
  themeId: ThemeId;
}

export interface ProposalAccessGrant {
  token: string;
  expiresAt: string;
}

export interface AppUser {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

import {
  Add01Icon,
  Analytics01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowReloadHorizontalIcon,
  ArrowRight01Icon,
  Briefcase01Icon,
  Cancel01Icon,
  Chart01Icon,
  CheckmarkCircle01Icon,
  Copy01Icon,
  Delete02Icon,
  DeliveryBox01Icon,
  Diamond01Icon,
  DragDropVerticalIcon,
  File01Icon,
  Globe02Icon,
  GridTableIcon,
  HelpCircleIcon,
  Home01Icon,
  Image01Icon,
  Leaf01Icon,
  Link01Icon,
  MailSend02Icon,
  PaintBrush01Icon,
  PresentationBarChart01Icon,
  QuoteUpIcon,
  Rocket01Icon,
  Settings01Icon,
  Share01Icon,
  Shield01Icon,
  ShuffleIcon,
  SparklesIcon,
  StarIcon,
  StarsIcon,
  TimelineIcon,
} from '@hugeicons/core-free-icons';

export const APP_ICON_REGISTRY = {
  'ui.home': Home01Icon,
  'ui.settings': Settings01Icon,
  'ui.sidebar-toggle': ArrowLeft01Icon,
  'ui.external-link': Link01Icon,
  'ui.add': Add01Icon,
  'ui.close': Cancel01Icon,
  'ui.delete': Delete02Icon,
  'ui.drag': DragDropVerticalIcon,
  'ui.chevron-down': ArrowDown01Icon,
  'ui.chevron-right': ArrowRight01Icon,
  'ui.copy': Copy01Icon,
  'ui.check': CheckmarkCircle01Icon,
  'ui.file': File01Icon,
  'ui.image': Image01Icon,
  'ui.mail-send': MailSend02Icon,
  'ui.share': Share01Icon,
  'ui.globe': Globe02Icon,
  'ui.help': HelpCircleIcon,
  'ui.refresh': ArrowReloadHorizontalIcon,
  'slide.type.title': SparklesIcon,
  'slide.type.intro': StarIcon,
  'slide.type.stats': Chart01Icon,
  'slide.type.features': StarIcon,
  'slide.type.testimonial': QuoteUpIcon,
  'slide.type.comparison': ShuffleIcon,
  'slide.type.timeline': TimelineIcon,
  'slide.type.media': Image01Icon,
  'slide.type.benefits': StarsIcon,
  'slide.type.table': GridTableIcon,
  'slide.type.closing': ArrowRight01Icon,
  'slide.features.protection': Shield01Icon,
  'slide.features.branding': PaintBrush01Icon,
  'slide.features.speed': Rocket01Icon,
  'slide.features.sustainability': Leaf01Icon,
  'slide.features.default': StarIcon,
  'slide.benefits.account-manager': Briefcase01Icon,
  'slide.benefits.priority-production': DeliveryBox01Icon,
  'slide.benefits.volume-pricing': Diamond01Icon,
  'slide.benefits.performance-reports': Analytics01Icon,
  'slide.benefits.default': PresentationBarChart01Icon,
} as const;

export type AppIconId = keyof typeof APP_ICON_REGISTRY;

const FALLBACK_ICON_ID: AppIconId = 'ui.help';

export function isAppIconId(value: string): value is AppIconId {
  return value in APP_ICON_REGISTRY;
}

export function resolveAppIconId(iconId?: string | null, fallbackIconId: AppIconId = FALLBACK_ICON_ID): AppIconId {
  if (iconId && isAppIconId(iconId)) {
    return iconId;
  }

  return fallbackIconId;
}

export function getAppIconById(iconId?: string | null, fallbackIconId?: AppIconId) {
  const resolvedIconId = resolveAppIconId(iconId, fallbackIconId);
  return APP_ICON_REGISTRY[resolvedIconId];
}

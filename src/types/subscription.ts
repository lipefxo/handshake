export type SubscriptionPlan = 'free' | 'pro' | 'team';

export type BillingInterval = 'monthly' | 'annual';

export type SubscriptionStatus =
  | 'active'
  | 'cancelled'
  | 'expired'
  | 'past_due'
  | 'paused'
  | 'on_trial'
  | 'unpaid';

export type PlanFeature =
  | 'duplicateProposal'
  | 'allThemes'
  | 'workspaceBranding'
  | 'passwordProtection'
  | 'emailGate'
  | 'analytics'
  | 'emailDelivery'
  | 'teamWorkspace'
  | 'teamComments'
  | 'templatesLibrary'
  | 'assetLibrary'
  | 'aiAssistant'
  | 'slackNotifications'
  | 'webhookEventsApi';

export interface Subscription {
  id: string;
  workspaceId: string;
  lemonSqueezySubscriptionId: string;
  lemonSqueezyCustomerId: string;
  lemonSqueezyVariantId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingInterval?: BillingInterval;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAt?: string;
  cancelledAt?: string;
  trialEndsAt?: string;
  updatePaymentMethodUrl?: string;
  customerPortalUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanLimits {
  maxProposals: number;
  maxMembers: number;
  availableThemes: 'all' | string[];
  features: Record<PlanFeature, boolean>;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    maxProposals: 3,
    maxMembers: 1,
    availableThemes: ['dark-minimal'],
    features: {
      duplicateProposal: false,
      allThemes: false,
      workspaceBranding: false,
      passwordProtection: false,
      emailGate: false,
      analytics: false,
      emailDelivery: false,
      teamWorkspace: false,
      teamComments: false,
      templatesLibrary: false,
      assetLibrary: false,
      aiAssistant: false,
      slackNotifications: false,
      webhookEventsApi: false,
    },
  },
  pro: {
    maxProposals: Number.POSITIVE_INFINITY,
    maxMembers: 1,
    availableThemes: 'all',
    features: {
      duplicateProposal: true,
      allThemes: true,
      workspaceBranding: true,
      passwordProtection: true,
      emailGate: false,
      analytics: true,
      emailDelivery: true,
      teamWorkspace: false,
      teamComments: false,
      templatesLibrary: false,
      assetLibrary: false,
      aiAssistant: false,
      slackNotifications: false,
      webhookEventsApi: false,
    },
  },
  team: {
    maxProposals: Number.POSITIVE_INFINITY,
    maxMembers: Number.POSITIVE_INFINITY,
    availableThemes: 'all',
    features: {
      duplicateProposal: true,
      allThemes: true,
      workspaceBranding: true,
      passwordProtection: true,
      emailGate: true,
      analytics: true,
      emailDelivery: true,
      teamWorkspace: true,
      teamComments: true,
      templatesLibrary: true,
      assetLibrary: true,
      aiAssistant: true,
      slackNotifications: true,
      webhookEventsApi: true,
    },
  },
};

export const PLAN_DISPLAY: Record<SubscriptionPlan, { label: string; monthly: number; annual: number }> = {
  free: { label: 'Free', monthly: 0, annual: 0 },
  pro: { label: 'Pro', monthly: 19, annual: 16 },
  team: { label: 'Team', monthly: 35, annual: 29 },
};

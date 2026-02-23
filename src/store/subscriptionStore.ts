import { create } from 'zustand';
import { createCheckout, lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';
import { supabase } from '../supabaseClient';
import { PLAN_LIMITS, type BillingInterval, type PlanFeature, type Subscription, type SubscriptionPlan } from '../types/subscription';

interface OpenCheckoutInput {
  workspaceId: string;
  userId: string;
  userEmail: string;
  plan: Exclude<SubscriptionPlan, 'free'>;
  billingInterval: Exclude<BillingInterval, undefined>;
}

interface SubscriptionStore {
  subscription: Subscription | null;
  plan: SubscriptionPlan;
  loading: boolean;
  error: string | null;
  setPlan: (plan: SubscriptionPlan) => void;
  clearError: () => void;
  fetchSubscription: (workspaceId: string) => Promise<void>;
  openCheckout: (input: OpenCheckoutInput) => Promise<void>;
  openCustomerPortal: () => void;
  canUseFeature: (feature: PlanFeature) => boolean;
  isFeatureGated: (feature: PlanFeature) => boolean;
  canCreateProposal: (currentProposalCount: number) => boolean;
}

function toSubscription(row: Record<string, unknown>): Subscription {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    lemonSqueezySubscriptionId: row.lemon_squeezy_subscription_id as string,
    lemonSqueezyCustomerId: row.lemon_squeezy_customer_id as string,
    lemonSqueezyVariantId: row.lemon_squeezy_variant_id as string,
    plan: (row.plan as SubscriptionPlan) ?? 'free',
    status: row.status as Subscription['status'],
    billingInterval: (row.billing_interval as BillingInterval | null | undefined) ?? undefined,
    currentPeriodStart: (row.current_period_start as string | null | undefined) ?? undefined,
    currentPeriodEnd: (row.current_period_end as string | null | undefined) ?? undefined,
    cancelAt: (row.cancel_at as string | null | undefined) ?? undefined,
    cancelledAt: (row.cancelled_at as string | null | undefined) ?? undefined,
    trialEndsAt: (row.trial_ends_at as string | null | undefined) ?? undefined,
    updatePaymentMethodUrl: (row.update_payment_method_url as string | null | undefined) ?? undefined,
    customerPortalUrl: (row.customer_portal_url as string | null | undefined) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function getVariantId(plan: Exclude<SubscriptionPlan, 'free'>, interval: Exclude<BillingInterval, undefined>): string | null {
  if (plan === 'pro' && interval === 'monthly') return import.meta.env.VITE_LEMON_SQUEEZY_PRO_MONTHLY_VARIANT_ID ?? null;
  if (plan === 'pro' && interval === 'annual') return import.meta.env.VITE_LEMON_SQUEEZY_PRO_ANNUAL_VARIANT_ID ?? null;
  if (plan === 'team' && interval === 'monthly') return import.meta.env.VITE_LEMON_SQUEEZY_TEAM_MONTHLY_VARIANT_ID ?? null;
  if (plan === 'team' && interval === 'annual') return import.meta.env.VITE_LEMON_SQUEEZY_TEAM_ANNUAL_VARIANT_ID ?? null;
  return null;
}

function getCheckoutOptions() {
  return {
    checkoutOptions: {
      embed: true,
      media: false,
      logo: true,
    },
  };
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  subscription: null,
  plan: 'free',
  loading: false,
  error: null,

  setPlan: (plan) => set({ plan }),

  clearError: () => set({ error: null }),

  fetchSubscription: async (workspaceId) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .maybeSingle();

      if (error) {
        set({ loading: false, error: error.message });
        return;
      }

      if (!data) {
        // Fallback to workspace-level plan so free users still resolve correctly.
        const { data: workspaceData, error: workspaceError } = await supabase
          .from('workspaces')
          .select('plan')
          .eq('id', workspaceId)
          .maybeSingle();

        if (workspaceError) {
          set({ loading: false, error: workspaceError.message });
          return;
        }

        set({
          subscription: null,
          plan: ((workspaceData?.plan as SubscriptionPlan | undefined) ?? 'free'),
          loading: false,
        });
        return;
      }

      const subscription = toSubscription(data as Record<string, unknown>);
      set({
        subscription,
        plan: subscription.plan,
        loading: false,
      });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : 'Failed to load subscription.' });
    }
  },

  openCheckout: async ({ workspaceId, userId, userEmail, plan, billingInterval }) => {
    const storeId = import.meta.env.VITE_LEMON_SQUEEZY_STORE_ID as string | undefined;
    const variantId = getVariantId(plan, billingInterval);

    if (!storeId || !variantId) {
      set({ error: 'Missing Lemon Squeezy checkout configuration.' });
      return;
    }

    lemonSqueezySetup({});

    const checkout = await createCheckout(storeId, variantId, {
      ...getCheckoutOptions(),
      checkoutData: {
        email: userEmail,
        custom: {
          workspace_id: workspaceId,
          user_id: userId,
        },
      },
    });

    const checkoutUrl = (checkout.data as { data?: { attributes?: { url?: string } } } | undefined)?.data?.attributes?.url;
    if (!checkoutUrl) {
      set({ error: 'Failed to start checkout.' });
      return;
    }

    // Overlay-first flow; fallback to full-page redirect if script is unavailable.
    const lemonWindow = window as unknown as { LemonSqueezy?: { Url?: { Open?: (url: string) => void } } };
    if (lemonWindow.LemonSqueezy?.Url?.Open) {
      lemonWindow.LemonSqueezy.Url.Open(checkoutUrl);
      return;
    }
    window.location.assign(checkoutUrl);
  },

  openCustomerPortal: () => {
    const portalUrl = get().subscription?.customerPortalUrl;
    if (!portalUrl) {
      set({ error: 'Customer portal is not available yet. Complete checkout first.' });
      return;
    }
    window.open(portalUrl, '_blank', 'noopener,noreferrer');
  },

  canUseFeature: (feature) => {
    const plan = get().plan;
    return PLAN_LIMITS[plan].features[feature];
  },

  isFeatureGated: (feature) => {
    return !get().canUseFeature(feature);
  },

  canCreateProposal: (currentProposalCount) => {
    const plan = get().plan;
    const maxProposals = PLAN_LIMITS[plan].maxProposals;
    return currentProposalCount < maxProposals;
  },
}));

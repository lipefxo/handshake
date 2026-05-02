import { create } from 'zustand';
import { supabase } from '../supabaseClient';
import { useWorkspaceStore } from './workspaceStore';
import type { BillingStatus, BillingSubscription, PlanTier } from '../types/billing';

interface BillingStore {
  loading: boolean;
  error: string | null;
  subscription: BillingSubscription | null;
  refresh: () => Promise<void>;
  startCheckout: (priceId: string) => Promise<void>;
  openPortal: () => Promise<void>;
  clearBillingState: () => void;
}

function emptySubscription(workspaceId: string): BillingSubscription {
  return {
    workspaceId,
    planTier: 'free',
    status: 'inactive',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    priceId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    trialEnd: null,
  };
}

function rowToSubscription(workspaceId: string, row: Record<string, unknown>): BillingSubscription {
  return {
    workspaceId,
    planTier: (row.plan_tier as PlanTier) ?? 'free',
    status: (row.status as BillingStatus) ?? 'inactive',
    stripeCustomerId: (row.stripe_customer_id as string | null) ?? null,
    stripeSubscriptionId: (row.stripe_subscription_id as string | null) ?? null,
    priceId: (row.price_id as string | null) ?? null,
    currentPeriodEnd: (row.current_period_end as string | null) ?? null,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    trialEnd: (row.trial_end as string | null) ?? null,
  };
}

function getSettingsReturnUrl(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/admin/settings`;
}

export const useBillingStore = create<BillingStore>((set) => ({
  loading: false,
  error: null,
  subscription: null,

  clearBillingState: () => set({ loading: false, error: null, subscription: null }),

  refresh: async () => {
    const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id ?? null;
    if (!workspaceId) {
      set({ subscription: null, error: null });
      return;
    }

    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('workspace_subscriptions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    set({
      loading: false,
      subscription: data ? rowToSubscription(workspaceId, data) : emptySubscription(workspaceId),
    });
  },

  startCheckout: async (priceId: string) => {
    const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id ?? null;
    if (!workspaceId) {
      set({ error: 'No workspace selected.' });
      return;
    }

    set({ loading: true, error: null });
    const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(
      'stripe-create-checkout-session',
      {
        body: { workspaceId, priceId, returnUrl: getSettingsReturnUrl() },
      },
    );

    if (error || !data?.url) {
      set({ loading: false, error: data?.error ?? error?.message ?? 'Could not start checkout.' });
      return;
    }

    window.location.assign(data.url);
  },

  openPortal: async () => {
    const workspaceId = useWorkspaceStore.getState().currentWorkspace?.id ?? null;
    if (!workspaceId) {
      set({ error: 'No workspace selected.' });
      return;
    }

    set({ loading: true, error: null });
    const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(
      'stripe-create-portal-session',
      {
        body: { workspaceId, returnUrl: getSettingsReturnUrl() },
      },
    );

    if (error || !data?.url) {
      set({ loading: false, error: data?.error ?? error?.message ?? 'Could not open billing portal.' });
      return;
    }

    window.location.assign(data.url);
  },
}));

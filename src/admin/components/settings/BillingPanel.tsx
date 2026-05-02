import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBillingStore } from '../../../store/billingStore';
import { formatDate } from '../../../shared/utils/helpers';
import type { PlanTier } from '../../../types/billing';

interface BillingPanelProps {
  isOwner: boolean;
}

type BillingCycle = 'monthly' | 'yearly';

interface PaidTierConfig {
  tier: 'pro' | 'team';
  label: string;
  description: string;
  prices: Partial<Record<BillingCycle, string>>;
}

const PAID_TIERS: PaidTierConfig[] = [
  {
    tier: 'pro',
    label: 'Pro',
    description: 'Workspace branding, analytics, password sharing, version history.',
    prices: {
      monthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY,
      yearly: import.meta.env.VITE_STRIPE_PRICE_PRO_YEARLY,
    },
  },
  {
    tier: 'team',
    label: 'Team',
    description: 'Shared workspace, team comments, AI assistant, lead capture, SSO support.',
    prices: {
      monthly: import.meta.env.VITE_STRIPE_PRICE_TEAM_MONTHLY,
      yearly: import.meta.env.VITE_STRIPE_PRICE_TEAM_YEARLY,
    },
  },
];

const TIER_LABEL: Record<PlanTier, string> = { free: 'Free', pro: 'Pro', team: 'Team' };

function statusLabel(status: string, cancelAtPeriodEnd: boolean, periodEnd: string | null): string {
  if (cancelAtPeriodEnd && periodEnd) return `Cancels ${formatDate(periodEnd)}`;
  switch (status) {
    case 'active':
      return 'Active';
    case 'trialing':
      return 'Trial';
    case 'past_due':
      return 'Past due';
    case 'canceled':
      return 'Canceled';
    case 'incomplete':
    case 'incomplete_expired':
      return 'Incomplete';
    case 'unpaid':
      return 'Unpaid';
    case 'paused':
      return 'Paused';
    default:
      return 'Inactive';
  }
}

export function BillingPanel({ isOwner }: BillingPanelProps) {
  const subscription = useBillingStore((s) => s.subscription);
  const loading = useBillingStore((s) => s.loading);
  const error = useBillingStore((s) => s.error);
  const refresh = useBillingStore((s) => s.refresh);
  const startCheckout = useBillingStore((s) => s.startCheckout);
  const openPortal = useBillingStore((s) => s.openPortal);

  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [pendingPriceId, setPendingPriceId] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const billingParam = searchParams.get('billing');
  const successRetriesRef = useRef(0);

  // Refresh on mount.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Success-redirect race: webhook may lag the redirect by a few hundred ms.
  // Retry refresh up to 3 times until the tier flips off 'free'.
  useEffect(() => {
    if (billingParam !== 'success') return;
    successRetriesRef.current = 0;

    const attempt = async () => {
      await refresh();
      const current = useBillingStore.getState().subscription;
      successRetriesRef.current += 1;
      if (
        current?.planTier !== 'free' ||
        successRetriesRef.current >= 3
      ) {
        return;
      }
      const delay = [1000, 2000, 4000][successRetriesRef.current - 1] ?? 4000;
      window.setTimeout(() => void attempt(), delay);
    };
    void attempt();
  }, [billingParam, refresh]);

  const dismissBanner = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('billing');
    setSearchParams(next, { replace: true });
  };

  const planTier = subscription?.planTier ?? 'free';
  const status = subscription?.status ?? 'inactive';
  const periodEnd = subscription?.currentPeriodEnd ?? null;
  const cancelAtPeriodEnd = subscription?.cancelAtPeriodEnd ?? false;
  const onPaidPlan = planTier !== 'free';

  const statusVariant = useMemo<'default' | 'secondary' | 'destructive'>(() => {
    if (cancelAtPeriodEnd) return 'secondary';
    if (status === 'active' || status === 'trialing') return 'default';
    if (status === 'past_due' || status === 'unpaid' || status === 'incomplete') return 'destructive';
    return 'secondary';
  }, [status, cancelAtPeriodEnd]);

  const handleUpgrade = async (priceId: string | undefined) => {
    if (!priceId) return;
    setPendingPriceId(priceId);
    await startCheckout(priceId);
    setPendingPriceId(null);
  };

  const handleManage = async () => {
    setOpeningPortal(true);
    await openPortal();
    setOpeningPortal(false);
  };

  return (
    <div className="space-y-5">
      {billingParam === 'success' && (
        <div className="flex items-start justify-between gap-3 rounded-[var(--app-radius-md)] border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          <span>
            Subscription activated. It may take a few seconds for the page to reflect changes.
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto px-2 py-1 text-xs text-emerald-700 hover:text-emerald-800"
            onClick={dismissBanner}
          >
            Dismiss
          </Button>
        </div>
      )}

      {billingParam === 'cancel' && (
        <div className="flex items-start justify-between gap-3 rounded-[var(--app-radius-md)] border border-[var(--app-border-subtle)] bg-[var(--app-bg-muted)] px-3 py-2 text-xs text-[var(--app-text-secondary)]">
          <span>Checkout canceled. No changes were made to your subscription.</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto px-2 py-1 text-xs"
            onClick={dismissBanner}
          >
            Dismiss
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-[var(--app-radius-md)] border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 rounded-[var(--app-radius-md)] border border-[var(--app-border-subtle)] bg-[var(--app-bg-muted)] px-3 py-3">
        <div className="flex items-center gap-3">
          <span className="font-brand-mono text-[11px] uppercase tracking-[0.12em] text-[var(--app-text-muted)]">
            Current plan
          </span>
          <Badge variant="outline" className="text-[11px]">
            {TIER_LABEL[planTier]}
          </Badge>
          <Badge variant={statusVariant} className="text-[11px]">
            {statusLabel(status, cancelAtPeriodEnd, periodEnd)}
          </Badge>
          {!cancelAtPeriodEnd && periodEnd && (status === 'active' || status === 'trialing') && (
            <span className="text-xs text-[var(--app-text-muted)]">
              Renews {formatDate(periodEnd)}
            </span>
          )}
        </div>

        {onPaidPlan && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!isOwner || openingPortal || loading}
            onClick={handleManage}
          >
            {openingPortal ? 'Opening…' : 'Manage billing'}
          </Button>
        )}
      </div>

      {!onPaidPlan && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-[var(--app-text-secondary)]">
              Upgrade to unlock branding, analytics, and team features.
            </p>
            <div className="inline-flex items-center rounded-[var(--app-radius-sm)] border border-[var(--app-border-subtle)] bg-[var(--app-bg-canvas)] p-0.5 text-xs">
              {(['monthly', 'yearly'] as BillingCycle[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCycle(c)}
                  className={`px-2.5 py-1 rounded-[calc(var(--app-radius-sm)-2px)] transition-colors ${
                    cycle === c
                      ? 'bg-gray-900 text-white'
                      : 'text-[var(--app-text-secondary)] hover:text-[var(--app-text-strong)]'
                  }`}
                >
                  {c === 'monthly' ? 'Monthly' : 'Yearly'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {PAID_TIERS.map((tier) => {
              const priceId = tier.prices[cycle];
              const isPending = pendingPriceId === priceId;
              return (
                <div
                  key={tier.tier}
                  className="flex flex-col gap-2 rounded-[var(--app-radius-md)] border border-[var(--app-border-subtle)] bg-[var(--app-bg-canvas)] px-3 py-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-brand-mono text-[11px] uppercase tracking-[0.12em] text-[var(--app-text-muted)]">
                      {tier.label}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--app-text-secondary)]">{tier.description}</p>
                  <Button
                    type="button"
                    size="sm"
                    className="self-start"
                    disabled={!isOwner || !priceId || isPending || loading}
                    onClick={() => void handleUpgrade(priceId)}
                  >
                    {!priceId
                      ? 'Unavailable'
                      : isPending
                      ? 'Opening checkout…'
                      : `Upgrade to ${tier.label}`}
                  </Button>
                </div>
              );
            })}
          </div>

          {!isOwner && (
            <p className="text-xs text-[var(--app-text-muted)]">
              Only workspace owners can manage billing.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

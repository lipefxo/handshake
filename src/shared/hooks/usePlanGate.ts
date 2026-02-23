import { useMemo } from 'react';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { type PlanFeature, type SubscriptionPlan } from '../../types/subscription';

interface PlanGateResult {
  allowed: boolean;
  requiredPlan: SubscriptionPlan;
  currentPlan: SubscriptionPlan;
}

const PLAN_ORDER: SubscriptionPlan[] = ['free', 'pro', 'team'];

const FEATURE_MIN_PLAN: Record<PlanFeature, SubscriptionPlan> = {
  duplicateProposal: 'pro',
  allThemes: 'pro',
  workspaceBranding: 'pro',
  passwordProtection: 'pro',
  emailGate: 'team',
  analytics: 'pro',
  emailDelivery: 'pro',
  teamWorkspace: 'team',
  teamComments: 'team',
  templatesLibrary: 'team',
  assetLibrary: 'team',
  aiAssistant: 'team',
  slackNotifications: 'team',
  webhookEventsApi: 'team',
};

function isPlanAtLeast(current: SubscriptionPlan, required: SubscriptionPlan): boolean {
  return PLAN_ORDER.indexOf(current) >= PLAN_ORDER.indexOf(required);
}

export function usePlanGate(feature: PlanFeature): PlanGateResult {
  const currentPlan = useSubscriptionStore((state) => state.plan);

  return useMemo(() => {
    const requiredPlan = FEATURE_MIN_PLAN[feature];
    return {
      allowed: isPlanAtLeast(currentPlan, requiredPlan),
      requiredPlan,
      currentPlan,
    };
  }, [currentPlan, feature]);
}

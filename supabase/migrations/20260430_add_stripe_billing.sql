-- ============================================================
-- Stripe billing — workspace subscriptions
-- ============================================================

-- One row per workspace, lazy-created on first paid checkout.
CREATE TABLE IF NOT EXISTS workspace_subscriptions (
  workspace_id            UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT NOT NULL UNIQUE,
  stripe_subscription_id  TEXT UNIQUE,
  plan_tier               TEXT NOT NULL DEFAULT 'free'
                            CHECK (plan_tier IN ('free', 'pro', 'team')),
  status                  TEXT NOT NULL DEFAULT 'inactive'
                            CHECK (status IN (
                              'inactive', 'trialing', 'active', 'past_due',
                              'canceled', 'incomplete', 'incomplete_expired',
                              'unpaid', 'paused'
                            )),
  price_id                TEXT,
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN NOT NULL DEFAULT false,
  trial_end               TIMESTAMPTZ,
  latest_event_id         TEXT,
  latest_event_at         TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ws_subs_stripe_customer_id
  ON workspace_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_ws_subs_stripe_subscription_id
  ON workspace_subscriptions(stripe_subscription_id);

ALTER TABLE workspace_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read workspace subscription"
  ON workspace_subscriptions;
CREATE POLICY "Members can read workspace subscription"
  ON workspace_subscriptions FOR SELECT
  USING (public.is_workspace_member(workspace_id));

-- No INSERT / UPDATE / DELETE policies — service role bypasses RLS,
-- and the Stripe webhook is the only writer.

DROP TRIGGER IF EXISTS workspace_subscriptions_updated_at ON workspace_subscriptions;
CREATE TRIGGER workspace_subscriptions_updated_at
  BEFORE UPDATE ON workspace_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Webhook event dedup table — service role only
-- ============================================================

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id     TEXT PRIMARY KEY,
  type         TEXT NOT NULL,
  received_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- No policies: service-role only.

-- ============================================================
-- Plan tier resolver — derived, single source of truth
-- ============================================================

CREATE OR REPLACE FUNCTION public.workspace_plan_tier(target_workspace_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT plan_tier
      FROM workspace_subscriptions
      WHERE workspace_id = target_workspace_id
        AND status IN ('trialing', 'active', 'past_due')
    ),
    'free'
  );
$$;

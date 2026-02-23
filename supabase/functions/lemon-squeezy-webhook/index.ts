import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
};

type SubscriptionPlan = 'free' | 'pro' | 'team';
type BillingInterval = 'monthly' | 'annual' | null;
type SubscriptionStatus =
  | 'active'
  | 'cancelled'
  | 'expired'
  | 'past_due'
  | 'paused'
  | 'on_trial'
  | 'unpaid';

interface LemonEvent {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, unknown>;
  };
  data?: {
    id?: string;
    attributes?: Record<string, unknown>;
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function toStringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function toTimestamp(value: unknown): string | null {
  const str = toStringValue(value);
  if (!str) return null;
  const time = Date.parse(str);
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

function toBillingInterval(value: unknown): BillingInterval {
  if (value === 'monthly' || value === 'month') return 'monthly';
  if (value === 'yearly' || value === 'annual' || value === 'year') return 'annual';
  return null;
}

function mapStatus(value: unknown): SubscriptionStatus {
  const status = toStringValue(value)?.toLowerCase();
  switch (status) {
    case 'active':
      return 'active';
    case 'cancelled':
      return 'cancelled';
    case 'expired':
      return 'expired';
    case 'past_due':
    case 'past-due':
      return 'past_due';
    case 'paused':
      return 'paused';
    case 'on_trial':
    case 'on-trial':
      return 'on_trial';
    case 'unpaid':
      return 'unpaid';
    default:
      return 'active';
  }
}

function mapPlanFromVariantId(variantId: string): SubscriptionPlan {
  const proMonthly = getEnv('LEMON_SQUEEZY_PRO_MONTHLY_VARIANT_ID');
  const proAnnual = getEnv('LEMON_SQUEEZY_PRO_ANNUAL_VARIANT_ID');
  const teamMonthly = getEnv('LEMON_SQUEEZY_TEAM_MONTHLY_VARIANT_ID');
  const teamAnnual = getEnv('LEMON_SQUEEZY_TEAM_ANNUAL_VARIANT_ID');

  if (variantId === proMonthly || variantId === proAnnual) return 'pro';
  if (variantId === teamMonthly || variantId === teamAnnual) return 'team';
  return 'free';
}

async function verifySignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const digestHex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return digestHex === signature.toLowerCase();
}

function getWorkspaceId(event: LemonEvent, attributes: Record<string, unknown>): string | null {
  const customDataMeta = (event.meta?.custom_data ?? {}) as Record<string, unknown>;
  const customDataAttributes = (attributes.custom_data ?? {}) as Record<string, unknown>;

  return (
    toStringValue(customDataMeta.workspace_id) ??
    toStringValue(customDataAttributes.workspace_id) ??
    toStringValue(attributes.workspace_id)
  );
}

function getEventName(event: LemonEvent): string | null {
  const metaName = toStringValue(event.meta?.event_name);
  const fallbackName = toStringValue((event as Record<string, unknown>).event_name);
  return metaName ?? fallbackName;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

  try {
    const supabaseUrl = getEnv('SUPABASE_URL');
    const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
    const webhookSecret = getEnv('LEMON_SQUEEZY_WEBHOOK_SECRET');
    const signature = req.headers.get('x-signature');

    if (!signature) return jsonResponse({ error: 'Missing X-Signature header.' }, 401);

    const rawBody = await req.text();
    const isValid = await verifySignature(rawBody, signature, webhookSecret);
    if (!isValid) return jsonResponse({ error: 'Invalid webhook signature.' }, 401);

    const event = JSON.parse(rawBody) as LemonEvent;
    const eventName = getEventName(event);
    const attributes = event.data?.attributes ?? {};
    const lemonSubscriptionId = toStringValue(event.data?.id);
    const workspaceId = getWorkspaceId(event, attributes);

    if (!eventName || !workspaceId || !lemonSubscriptionId) {
      return jsonResponse({ error: 'Webhook payload missing required fields.' }, 400);
    }

    const variantId = toStringValue(attributes.variant_id) ?? '';
    const plan = mapPlanFromVariantId(variantId);
    const status = mapStatus(attributes.status);
    const customerId =
      toStringValue(attributes.customer_id) ??
      toStringValue((attributes.customer as Record<string, unknown> | undefined)?.id) ??
      'unknown';
    const billingInterval = toBillingInterval(attributes.billing_interval);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const upsertPayload = {
      workspace_id: workspaceId,
      lemon_squeezy_subscription_id: lemonSubscriptionId,
      lemon_squeezy_customer_id: customerId,
      lemon_squeezy_variant_id: variantId,
      plan,
      status,
      billing_interval: billingInterval,
      current_period_start: toTimestamp(attributes.current_period_start),
      current_period_end: toTimestamp(attributes.current_period_end),
      cancel_at: toTimestamp(attributes.cancel_at),
      cancelled_at: toTimestamp(attributes.cancelled_at),
      trial_ends_at: toTimestamp(attributes.trial_ends_at),
      update_payment_method_url: toNullableString(attributes.urls && (attributes.urls as Record<string, unknown>).update_payment_method),
      customer_portal_url: toNullableString(attributes.urls && (attributes.urls as Record<string, unknown>).customer_portal),
    };

    const { error: subscriptionError } = await adminClient
      .from('subscriptions')
      .upsert(upsertPayload, { onConflict: 'workspace_id' });

    if (subscriptionError) {
      return jsonResponse({ error: subscriptionError.message }, 500);
    }

    // Keep workspace.plan in sync with current subscription.
    const periodEnd = toTimestamp(attributes.current_period_end);
    const now = new Date();
    const isPeriodEnded = periodEnd ? new Date(periodEnd) <= now : false;
    const workspacePlan: SubscriptionPlan =
      eventName === 'subscription_expired' || (eventName === 'subscription_cancelled' && isPeriodEnded)
        ? 'free'
        : plan;

    const { error: workspaceUpdateError } = await adminClient
      .from('workspaces')
      .update({ plan: workspacePlan })
      .eq('id', workspaceId);

    if (workspaceUpdateError) {
      return jsonResponse({ error: workspaceUpdateError.message }, 500);
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unexpected error handling webhook.' },
      500,
    );
  }
});

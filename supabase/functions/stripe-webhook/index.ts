import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@^17';

interface PriceTierMap {
  [priceId: string]: 'pro' | 'team';
}

function readPriceTierMap(): PriceTierMap {
  const map: PriceTierMap = {};
  const proKeys = ['STRIPE_PRICE_PRO_MONTHLY', 'STRIPE_PRICE_PRO_YEARLY'];
  const teamKeys = ['STRIPE_PRICE_TEAM_MONTHLY', 'STRIPE_PRICE_TEAM_YEARLY'];
  for (const k of proKeys) {
    const v = Deno.env.get(k)?.trim();
    if (v) map[v] = 'pro';
  }
  for (const k of teamKeys) {
    const v = Deno.env.get(k)?.trim();
    if (v) map[v] = 'team';
  }
  return map;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function tierForSubscription(
  subscription: Stripe.Subscription,
  priceMap: PriceTierMap,
): 'free' | 'pro' | 'team' {
  const priceId = subscription.items?.data?.[0]?.price?.id;
  if (priceId && priceMap[priceId]) return priceMap[priceId];
  return 'free';
}

function toIso(epochSeconds: number | null | undefined): string | null {
  if (!epochSeconds && epochSeconds !== 0) return null;
  return new Date(epochSeconds * 1000).toISOString();
}

async function handleSubscriptionUpsert(
  admin: SupabaseClient,
  subscription: Stripe.Subscription,
  event: Stripe.Event,
  priceMap: PriceTierMap,
): Promise<void> {
  const workspaceId =
    (subscription.metadata?.workspace_id as string | undefined) ??
    (await resolveWorkspaceIdByCustomer(admin, subscription.customer));
  if (!workspaceId) {
    console.warn('stripe-webhook: no workspace_id resolvable for subscription', subscription.id);
    return;
  }

  const tier = tierForSubscription(subscription, priceMap);
  const periodEnd =
    // Stripe types vary across API versions; fall back via cast
    toIso((subscription as unknown as { current_period_end?: number }).current_period_end);
  const trialEnd = toIso(subscription.trial_end ?? null);

  const eventCreatedIso = toIso(event.created);

  // If we already saw a newer event for this row, skip the stale write.
  const { data: existing } = await admin
    .from('workspace_subscriptions')
    .select('latest_event_at')
    .eq('workspace_id', workspaceId)
    .maybeSingle();
  if (existing?.latest_event_at && eventCreatedIso && existing.latest_event_at > eventCreatedIso) {
    return;
  }

  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

  await admin.from('workspace_subscriptions').upsert(
    {
      workspace_id: workspaceId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      plan_tier: tier,
      status: subscription.status,
      price_id: subscription.items?.data?.[0]?.price?.id ?? null,
      current_period_end: periodEnd,
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      trial_end: trialEnd,
      latest_event_id: event.id,
      latest_event_at: eventCreatedIso,
    },
    { onConflict: 'workspace_id' },
  );
}

async function handleSubscriptionDeleted(
  admin: SupabaseClient,
  subscription: Stripe.Subscription,
  event: Stripe.Event,
): Promise<void> {
  const workspaceId =
    (subscription.metadata?.workspace_id as string | undefined) ??
    (await resolveWorkspaceIdByCustomer(admin, subscription.customer));
  if (!workspaceId) return;

  await admin
    .from('workspace_subscriptions')
    .update({
      stripe_subscription_id: null,
      plan_tier: 'free',
      status: 'canceled',
      price_id: null,
      current_period_end: null,
      cancel_at_period_end: false,
      trial_end: null,
      latest_event_id: event.id,
      latest_event_at: toIso(event.created),
    })
    .eq('workspace_id', workspaceId);
}

async function handleInvoice(
  admin: SupabaseClient,
  invoice: Stripe.Invoice,
  event: Stripe.Event,
  paid: boolean,
): Promise<void> {
  const customerId =
    typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const workspaceId = await resolveWorkspaceIdByCustomer(admin, customerId);
  if (!workspaceId) return;

  const update: Record<string, unknown> = {
    status: paid ? 'active' : 'past_due',
    latest_event_id: event.id,
    latest_event_at: toIso(event.created),
  };

  // invoice.period_end is on the invoice's lines, but for v1 we trust the
  // subscription.updated event to refresh current_period_end. Just set status.
  await admin
    .from('workspace_subscriptions')
    .update(update)
    .eq('workspace_id', workspaceId);
}

async function resolveWorkspaceIdByCustomer(
  admin: SupabaseClient,
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): Promise<string | null> {
  if (!customer) return null;
  const customerId = typeof customer === 'string' ? customer : customer.id;
  const { data } = await admin
    .from('workspace_subscriptions')
    .select('workspace_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  return (data?.workspace_id as string | undefined) ?? null;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey =
    Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!stripeSecret || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
    console.error('stripe-webhook missing env vars');
    return jsonResponse({ error: 'Missing environment variables.' }, 500);
  }

  const signature = req.headers.get('Stripe-Signature') ?? req.headers.get('stripe-signature');
  if (!signature) return jsonResponse({ error: 'Missing Stripe signature.' }, 400);

  // Must read raw body BEFORE any JSON parse — signature verification depends on it.
  const rawBody = await req.text();

  const stripe = new Stripe(stripeSecret, { apiVersion: '2025-09-30.clover' });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error('stripe-webhook signature verification failed', error);
    return jsonResponse({ error: 'Invalid signature.' }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Idempotency dedup — if INSERT conflicts, this event was already processed.
  const { data: dedup, error: dedupError } = await admin
    .from('stripe_webhook_events')
    .insert({ event_id: event.id, type: event.type })
    .select('event_id')
    .maybeSingle();
  if (dedupError) {
    const code = (dedupError as { code?: string }).code;
    if (code === '23505') {
      // unique_violation — already processed
      return jsonResponse({ received: true, duplicate: true });
    }
    console.error('stripe-webhook dedup insert failed', dedupError);
    // Fall through and try to process anyway; webhook idempotency at the row
    // level (latest_event_at comparison) provides a second guard.
  }
  if (!dedup) {
    // Some clients return null for the inserted row even on success; we proceed.
  }

  const priceMap = readPriceTierMap();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionRef = session.subscription;
        if (!subscriptionRef) break;
        const subscriptionId =
          typeof subscriptionRef === 'string' ? subscriptionRef : subscriptionRef.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        // client_reference_id is the workspace_id we set when creating the session.
        if (session.client_reference_id && !subscription.metadata?.workspace_id) {
          subscription.metadata = {
            ...subscription.metadata,
            workspace_id: session.client_reference_id,
          };
        }
        await handleSubscriptionUpsert(admin, subscription, event, priceMap);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpsert(admin, subscription, event, priceMap);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(admin, subscription, event);
        break;
      }
      case 'invoice.paid': {
        await handleInvoice(admin, event.data.object as Stripe.Invoice, event, true);
        break;
      }
      case 'invoice.payment_failed': {
        await handleInvoice(admin, event.data.object as Stripe.Invoice, event, false);
        break;
      }
      default:
        // Unhandled events are acknowledged so Stripe doesn't retry.
        break;
    }
  } catch (error) {
    console.error('stripe-webhook handler error', { type: event.type, id: event.id, error });
    // Roll back the dedup row so retried delivery can re-process.
    await admin.from('stripe_webhook_events').delete().eq('event_id', event.id);
    return jsonResponse({ error: 'Handler error.' }, 500);
  }

  return jsonResponse({ received: true });
});

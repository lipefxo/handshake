import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutPayload {
  workspaceId: string;
  priceId: string;
  returnUrl: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function readPriceAllowlist(): Set<string> {
  const keys = [
    'STRIPE_PRICE_PRO_MONTHLY',
    'STRIPE_PRICE_PRO_YEARLY',
    'STRIPE_PRICE_TEAM_MONTHLY',
    'STRIPE_PRICE_TEAM_YEARLY',
  ];
  return new Set(
    keys.map((k) => Deno.env.get(k)?.trim()).filter((v): v is string => Boolean(v)),
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey =
      Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !stripeSecret) {
      return jsonResponse(
        {
          error:
            'Missing environment variables. Required: SUPABASE_URL, SUPABASE_ANON_KEY, SERVICE_ROLE_KEY, STRIPE_SECRET_KEY.',
        },
        500,
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Missing authorization header.' }, 401);

    const payload = (await req.json()) as Partial<CheckoutPayload>;
    const workspaceId = payload.workspaceId?.trim();
    const priceId = payload.priceId?.trim();
    const returnUrl = payload.returnUrl?.trim();
    if (!workspaceId || !priceId || !returnUrl || !isValidUrl(returnUrl)) {
      return jsonResponse({ error: 'Invalid checkout payload.' }, 400);
    }

    const allowedPrices = readPriceAllowlist();
    if (!allowedPrices.has(priceId)) {
      return jsonResponse({ error: 'Unknown price.' }, 400);
    }

    const requesterClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: requesterError,
    } = await requesterClient.auth.getUser();
    if (requesterError || !user) {
      return jsonResponse({ error: 'Unauthorized request.' }, 401);
    }

    const { data: membership, error: membershipError } = await requesterClient
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .eq('status', 'active')
      .maybeSingle();

    if (membershipError || !membership) {
      return jsonResponse({ error: 'Only workspace owners can manage billing.' }, 403);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const stripe = new Stripe(stripeSecret, { apiVersion: '2025-09-30.clover' });

    const { data: existingSub, error: subLoadError } = await adminClient
      .from('workspace_subscriptions')
      .select('stripe_customer_id')
      .eq('workspace_id', workspaceId)
      .maybeSingle();
    if (subLoadError) {
      return jsonResponse({ error: subLoadError.message }, 500);
    }

    let customerId = existingSub?.stripe_customer_id ?? null;

    if (!customerId) {
      const { data: workspace, error: workspaceError } = await adminClient
        .from('workspaces')
        .select('id, name')
        .eq('id', workspaceId)
        .maybeSingle();
      if (workspaceError || !workspace) {
        return jsonResponse({ error: 'Workspace not found.' }, 404);
      }

      const customer = await stripe.customers.create(
        {
          name: (workspace.name as string) || 'Handshake Workspace',
          email: user.email ?? undefined,
          metadata: { workspace_id: workspaceId },
        },
        { idempotencyKey: `customer:${workspaceId}` },
      );
      customerId = customer.id;

      const { error: upsertError } = await adminClient
        .from('workspace_subscriptions')
        .upsert(
          {
            workspace_id: workspaceId,
            stripe_customer_id: customerId,
            plan_tier: 'free',
            status: 'inactive',
          },
          { onConflict: 'workspace_id' },
        );
      if (upsertError) {
        return jsonResponse({ error: upsertError.message }, 500);
      }
    }

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${returnUrl}?billing=success`,
        cancel_url: `${returnUrl}?billing=cancel`,
        client_reference_id: workspaceId,
        subscription_data: { metadata: { workspace_id: workspaceId } },
        allow_promotion_codes: true,
      },
      { idempotencyKey: `checkout:${workspaceId}:${priceId}` },
    );

    if (!session.url) {
      return jsonResponse({ error: 'Stripe did not return a Checkout URL.' }, 500);
    }

    return jsonResponse({ url: session.url });
  } catch (error) {
    console.error('stripe-create-checkout-session error', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unexpected error.' },
      500,
    );
  }
});

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const STRIPE_API_VERSION = '2025-09-30.clover' as unknown as Stripe.LatestApiVersion;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PortalPayload {
  workspaceId: string;
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

    const payload = (await req.json()) as Partial<PortalPayload>;
    const workspaceId = payload.workspaceId?.trim();
    const returnUrl = payload.returnUrl?.trim();
    if (!workspaceId || !returnUrl || !isValidUrl(returnUrl)) {
      return jsonResponse({ error: 'Invalid portal payload.' }, 400);
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
    const { data: subscription, error: subError } = await adminClient
      .from('workspace_subscriptions')
      .select('stripe_customer_id')
      .eq('workspace_id', workspaceId)
      .maybeSingle();
    if (subError) {
      return jsonResponse({ error: subError.message }, 500);
    }
    if (!subscription?.stripe_customer_id) {
      return jsonResponse({ error: 'Choose a plan first.' }, 400);
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: STRIPE_API_VERSION });
    const portal = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl,
    });

    return jsonResponse({ url: portal.url });
  } catch (error) {
    console.error('stripe-create-portal-session error', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unexpected error.' },
      500,
    );
  }
});

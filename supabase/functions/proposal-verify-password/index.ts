import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SESSION_TTL_DAYS = 30;
const MAX_PASSWORD_ATTEMPTS_PER_15_MIN = 10;

interface VerifyPasswordPayload {
  proposalId?: string;
  password?: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getIpAddress(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') || 'unknown';
}

async function logAttempt(
  adminClient: SupabaseClient,
  details: {
    proposalId: string;
    success: boolean;
    ipAddress: string;
    userAgent?: string;
    reason?: string;
  },
) {
  await adminClient.from('proposal_access_attempts').insert({
    proposal_id: details.proposalId,
    attempt_type: 'password',
    success: details.success,
    ip_address: details.ipAddress,
    user_agent: details.userAgent ?? null,
    reason: details.reason ?? null,
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'Missing Supabase environment variables.' }, 500);
    }

    const payload = (await req.json()) as VerifyPasswordPayload;
    const proposalId = payload.proposalId?.trim();
    const password = payload.password ?? '';
    if (!proposalId || !password.trim()) {
      return jsonResponse({ error: 'proposalId and password are required.' }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const ipAddress = getIpAddress(req);
    const userAgent = req.headers.get('user-agent') ?? undefined;

    const windowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count: recentAttempts } = await adminClient
      .from('proposal_access_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('proposal_id', proposalId)
      .eq('attempt_type', 'password')
      .eq('success', false)
      .eq('ip_address', ipAddress)
      .gte('created_at', windowStart);

    if ((recentAttempts ?? 0) >= MAX_PASSWORD_ATTEMPTS_PER_15_MIN) {
      await logAttempt(adminClient, {
        proposalId,
        success: false,
        ipAddress,
        userAgent,
        reason: 'rate_limited',
      });
      return jsonResponse({ error: 'Too many attempts. Please try again in a few minutes.' }, 429);
    }

    const { data: proposal, error: proposalError } = await adminClient
      .from('proposals')
      .select('id, status, visibility, access_password, expires_at')
      .eq('id', proposalId)
      .maybeSingle();

    if (proposalError || !proposal) {
      await logAttempt(adminClient, {
        proposalId,
        success: false,
        ipAddress,
        userAgent,
        reason: 'proposal_not_found',
      });
      return jsonResponse({ error: 'Proposal not found.' }, 404);
    }

    if (proposal.status !== 'published' || proposal.visibility !== 'password') {
      await logAttempt(adminClient, {
        proposalId,
        success: false,
        ipAddress,
        userAgent,
        reason: 'not_password_gated',
      });
      return jsonResponse({ error: 'Proposal is not password protected.' }, 400);
    }

    if (proposal.expires_at && new Date(proposal.expires_at).getTime() <= Date.now()) {
      await logAttempt(adminClient, {
        proposalId,
        success: false,
        ipAddress,
        userAgent,
        reason: 'proposal_expired',
      });
      return jsonResponse({ error: 'Proposal has expired.' }, 410);
    }

    if (!proposal.access_password) {
      await logAttempt(adminClient, {
        proposalId,
        success: false,
        ipAddress,
        userAgent,
        reason: 'password_not_configured',
      });
      return jsonResponse({ error: 'Password is not configured for this proposal.' }, 400);
    }

    const isMatch = await bcrypt.compare(password, proposal.access_password);
    if (!isMatch) {
      await logAttempt(adminClient, {
        proposalId,
        success: false,
        ipAddress,
        userAgent,
        reason: 'invalid_password',
      });
      return jsonResponse({ error: 'Incorrect password.' }, 401);
    }

    const sessionToken = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
    const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { error: insertSessionError } = await adminClient.from('proposal_access_sessions').insert({
      proposal_id: proposalId,
      session_token: sessionToken,
      access_type: 'password',
      expires_at: expiresAt,
      last_accessed_at: new Date().toISOString(),
    });

    if (insertSessionError) {
      await logAttempt(adminClient, {
        proposalId,
        success: false,
        ipAddress,
        userAgent,
        reason: 'session_create_failed',
      });
      return jsonResponse({ error: 'Failed to create access session.' }, 500);
    }

    await logAttempt(adminClient, {
      proposalId,
      success: true,
      ipAddress,
      userAgent,
      reason: 'access_granted',
    });

    return jsonResponse({ token: sessionToken, expiresAt });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500);
  }
});

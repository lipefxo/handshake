import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitePayload {
  workspaceId: string;
  workspaceName: string;
  email: string;
  origin?: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidOrigin(origin: string): boolean {
  try {
    const parsed = new URL(origin);
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
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return jsonResponse({ error: 'Missing Supabase environment variables.' }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Missing authorization header.' }, 401);

    const payload = (await req.json()) as Partial<InvitePayload>;
    const workspaceId = payload.workspaceId?.trim();
    const workspaceName = payload.workspaceName?.trim() || 'Workspace';
    const targetEmail = payload.email ? normalizeEmail(payload.email) : '';
    if (!workspaceId || !targetEmail.includes('@')) {
      return jsonResponse({ error: 'Invalid invite payload.' }, 400);
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
      return jsonResponse({ error: 'Only workspace owners can send invites.' }, 403);
    }

    const fallbackOrigin = Deno.env.get('SITE_URL') || Deno.env.get('PUBLIC_SITE_URL') || '';
    const inviteOrigin = payload.origin && isValidOrigin(payload.origin)
      ? payload.origin
      : isValidOrigin(fallbackOrigin)
      ? fallbackOrigin
      : undefined;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(targetEmail, {
      redirectTo: inviteOrigin ? `${inviteOrigin}/auth/callback` : undefined,
      data: {
        workspace_id: workspaceId,
        workspace_name: workspaceName,
        invited_by: user.email ?? user.id,
      },
    });

    if (inviteError) {
      return jsonResponse({ error: inviteError.message }, 400);
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unexpected error.' },
      500,
    );
  }
});

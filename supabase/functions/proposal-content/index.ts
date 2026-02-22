import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentPayload {
  slug?: string;
  shortCode?: string;
  accessToken?: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function mapProposalResponse(row: Record<string, unknown>, workspaceBrandTheme: unknown) {
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    slug: row.slug,
    shortCode: row.short_code,
    title: row.title,
    partnerName: row.partner_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    slides: row.slides,
    themeId: row.theme_id,
    visibility: row.visibility,
    expiresAt: row.expires_at,
    brandOverrides: row.brand_overrides ?? {},
    workspaceBrandTheme: workspaceBrandTheme ?? {},
  };
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

    const payload = (await req.json()) as ContentPayload;
    const slug = payload.slug?.trim();
    const shortCode = payload.shortCode?.trim();
    const accessToken = payload.accessToken?.trim();
    if (!slug && !shortCode) {
      return jsonResponse({ error: 'Either slug or shortCode is required.' }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const query = adminClient
      .from('proposals')
      .select('*')
      .limit(1);
    const { data: proposal, error: proposalError } = slug
      ? await query.eq('slug', slug).maybeSingle()
      : await query.eq('short_code', shortCode as string).maybeSingle();

    if (proposalError || !proposal) {
      return jsonResponse({ error: 'Proposal not found.' }, 404);
    }

    const authHeader = req.headers.get('Authorization');
    let isWorkspaceMember = false;
    if (authHeader) {
      const requesterClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const {
        data: { user },
        error: userError,
      } = await requesterClient.auth.getUser();
      if (!userError && user && proposal.workspace_id) {
        const { data: membership } = await requesterClient
          .from('workspace_members')
          .select('id')
          .eq('workspace_id', proposal.workspace_id)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        isWorkspaceMember = Boolean(membership);
      }
    }

    if (!isWorkspaceMember && proposal.status !== 'published') {
      return jsonResponse({ error: 'Proposal not found.' }, 404);
    }

    if (proposal.expires_at && new Date(proposal.expires_at).getTime() <= Date.now()) {
      return jsonResponse({ error: 'Proposal has expired.' }, 410);
    }

    if (!isWorkspaceMember && proposal.visibility !== 'public') {
      if (!accessToken) {
        return jsonResponse({ error: 'Access token required.' }, 403);
      }

      const { data: accessSession } = await adminClient
        .from('proposal_access_sessions')
        .select('id, expires_at')
        .eq('proposal_id', proposal.id)
        .eq('session_token', accessToken)
        .maybeSingle();

      if (!accessSession || new Date(accessSession.expires_at).getTime() <= Date.now()) {
        return jsonResponse({ error: 'Invalid or expired access token.' }, 403);
      }

      await adminClient
        .from('proposal_access_sessions')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('id', accessSession.id);
    }

    let workspaceBrandTheme: unknown = {};
    if (proposal.workspace_id) {
      const { data: workspaceData } = await adminClient
        .from('workspaces')
        .select('brand_theme')
        .eq('id', proposal.workspace_id)
        .maybeSingle();
      workspaceBrandTheme = workspaceData?.brand_theme ?? {};
    }

    return jsonResponse({ proposal: mapProposalResponse(proposal as Record<string, unknown>, workspaceBrandTheme) });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500);
  }
});

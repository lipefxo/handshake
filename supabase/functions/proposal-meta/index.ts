import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetaPayload {
  slug?: string;
  shortCode?: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

    const payload = (await req.json()) as MetaPayload;
    const slug = payload.slug?.trim();
    const shortCode = payload.shortCode?.trim();
    if (!slug && !shortCode) {
      return jsonResponse({ error: 'Either slug or shortCode is required.' }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const query = adminClient
      .from('proposals')
      .select('id, slug, short_code, title, partner_name, status, visibility, expires_at, theme_id')
      .eq('status', 'published')
      .limit(1);
    const { data, error } = slug
      ? await query.eq('slug', slug).maybeSingle()
      : await query.eq('short_code', shortCode as string).maybeSingle();

    if (error) {
      return jsonResponse({ error: 'Failed to load proposal metadata.' }, 500);
    }

    if (!data) {
      return jsonResponse({ proposal: null }, 200);
    }

    return jsonResponse({
      proposal: {
        id: data.id,
        slug: data.slug,
        shortCode: data.short_code,
        title: data.title,
        partnerName: data.partner_name,
        status: data.status,
        visibility: data.visibility,
        expiresAt: data.expires_at,
        themeId: data.theme_id,
      },
    });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500);
  }
});

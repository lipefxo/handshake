import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_EVENTS_PER_MINUTE = 60;

interface SlideEvent {
  slideIndex: number;
  slideType?: string;
  dwellTimeMs: number;
  enteredAt: string;
}

interface AnalyticsPayload {
  proposalId?: string;
  visitorId?: string;
  sessionId?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  referrer?: string;
  userAgent?: string;
  slidesTotal?: number;
  maxSlideReached?: number;
  durationMs?: number;
  events?: SlideEvent[];
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getCountry(req: Request): string | null {
  return (
    req.headers.get('cf-ipcountry') ||
    req.headers.get('x-vercel-ip-country') ||
    req.headers.get('x-country') ||
    null
  );
}

function getCity(req: Request): string | null {
  return (
    req.headers.get('cf-ipcity') ||
    req.headers.get('x-vercel-ip-city') ||
    req.headers.get('x-city') ||
    null
  );
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

    const payload = (await req.json()) as AnalyticsPayload;
    const { proposalId, visitorId, sessionId, deviceType, browser, os, referrer, userAgent, slidesTotal, maxSlideReached, durationMs, events } = payload;

    if (!proposalId || !visitorId || !sessionId) {
      return jsonResponse({ error: 'proposalId, visitorId, and sessionId are required.' }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Rate-limit: count events for this visitor in last 60 seconds
    const windowStart = new Date(Date.now() - 60 * 1000).toISOString();
    const { count: recentViewCount } = await adminClient
      .from('proposal_views')
      .select('id', { count: 'exact', head: true })
      .eq('visitor_id', visitorId)
      .gte('updated_at', windowStart);

    if ((recentViewCount ?? 0) >= MAX_EVENTS_PER_MINUTE) {
      return jsonResponse({ error: 'Rate limit exceeded.' }, 429);
    }

    // Verify the proposal exists and is published
    const { data: proposal } = await adminClient
      .from('proposals')
      .select('id')
      .eq('id', proposalId)
      .eq('status', 'published')
      .maybeSingle();

    if (!proposal) {
      return jsonResponse({ error: 'Proposal not found or not published.' }, 404);
    }

    const country = getCountry(req);
    const city = getCity(req);

    // Upsert the view session row
    const { data: viewRow, error: viewError } = await adminClient
      .from('proposal_views')
      .upsert(
        {
          proposal_id: proposalId,
          visitor_id: visitorId,
          session_id: sessionId,
          device_type: deviceType ?? null,
          browser: browser ?? null,
          os: os ?? null,
          country,
          city,
          referrer: referrer ?? null,
          user_agent: userAgent ?? null,
          slides_total: slidesTotal ?? 0,
          max_slide_reached: maxSlideReached ?? 0,
          duration_ms: durationMs ?? 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'session_id' },
      )
      .select('id')
      .single();

    if (viewError || !viewRow) {
      return jsonResponse({ error: 'Failed to record view.' }, 500);
    }

    // Batch insert slide events if provided
    if (events && events.length > 0) {
      const slideRows = events.map((e) => ({
        view_id: viewRow.id,
        proposal_id: proposalId,
        slide_index: e.slideIndex,
        slide_type: e.slideType ?? null,
        dwell_time_ms: e.dwellTimeMs,
        entered_at: e.enteredAt,
      }));

      await adminClient.from('proposal_slide_events').insert(slideRows);
    }

    return jsonResponse({ ok: true, viewId: viewRow.id });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500);
  }
});

import { create } from 'zustand';
import { supabase } from '../supabaseClient';

export interface SlideAnalytics {
  slideIndex: number;
  slideType: string | null;
  viewCount: number;
  avgDwellMs: number;
}

export interface RecentView {
  id: string;
  visitorId: string;
  deviceType: string | null;
  browser: string | null;
  country: string | null;
  city: string | null;
  maxSlideReached: number;
  slidesTotal: number;
  durationMs: number;
  createdAt: string;
}

export interface ProposalAnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  avgDurationMs: number;
  avgScrollDepthPct: number;
  viewsByDay: { date: string; views: number }[];
  slideBreakdown: SlideAnalytics[];
  deviceBreakdown: { deviceType: string; count: number }[];
  topCountries: { country: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
  recentViews: RecentView[];
}

interface AnalyticsStore {
  data: ProposalAnalyticsData | null;
  loading: boolean;
  error: string | null;
  proposalId: string | null;
  fetchProposalAnalytics: (proposalId: string) => Promise<void>;
  clearAnalytics: () => void;
}

/**
 * Try the server-side RPC function first (fast, pre-aggregated).
 * Falls back to client-side aggregation if the RPC doesn't exist yet.
 */
async function fetchViaRpc(proposalId: string): Promise<ProposalAnalyticsData | null> {
  const { data, error } = await supabase.rpc('get_proposal_analytics', {
    p_proposal_id: proposalId,
  });

  if (error) return null; // RPC not deployed yet, fall back

  const result = data as ProposalAnalyticsData | null;
  if (!result) return null;

  return {
    totalViews: result.totalViews ?? 0,
    uniqueVisitors: result.uniqueVisitors ?? 0,
    avgDurationMs: result.avgDurationMs ?? 0,
    avgScrollDepthPct: result.avgScrollDepthPct ?? 0,
    viewsByDay: result.viewsByDay ?? [],
    slideBreakdown: result.slideBreakdown ?? [],
    deviceBreakdown: result.deviceBreakdown ?? [],
    topCountries: result.topCountries ?? [],
    topReferrers: result.topReferrers ?? [],
    recentViews: result.recentViews ?? [],
  };
}

async function fetchClientSide(proposalId: string): Promise<ProposalAnalyticsData> {
  // Fetch all views for the proposal
  const { data: views, error: viewsError } = await supabase
    .from('proposal_views')
    .select('id, visitor_id, device_type, browser, country, city, max_slide_reached, slides_total, duration_ms, created_at, referrer')
    .eq('proposal_id', proposalId)
    .order('created_at', { ascending: false });

  if (viewsError) throw new Error(viewsError.message);

  const safeViews = views ?? [];

  // Fetch slide events
  const { data: slideEvents, error: slideError } = await supabase
    .from('proposal_slide_events')
    .select('slide_index, slide_type, dwell_time_ms')
    .eq('proposal_id', proposalId);

  if (slideError) throw new Error(slideError.message);

  const safeEvents = slideEvents ?? [];

  // --- Aggregate metrics ---

  const totalViews = safeViews.length;
  const uniqueVisitors = new Set(safeViews.map((v) => v.visitor_id)).size;

  const avgDurationMs =
    totalViews > 0
      ? Math.round(safeViews.reduce((sum, v) => sum + (v.duration_ms ?? 0), 0) / totalViews)
      : 0;

  const avgScrollDepthPct =
    totalViews > 0
      ? Math.round(
          safeViews.reduce((sum, v) => {
            const depth = v.slides_total > 0 ? ((v.max_slide_reached + 1) / v.slides_total) * 100 : 0;
            return sum + depth;
          }, 0) / totalViews,
        )
      : 0;

  // Views by day (last 30 days)
  const dayMap = new Map<string, number>();
  for (const v of safeViews) {
    const day = v.created_at.slice(0, 10);
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  }
  const viewsByDay = Array.from(dayMap.entries())
    .map(([date, viewCount]) => ({ date, views: viewCount }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  // Slide breakdown
  const slideMap = new Map<number, { type: string | null; count: number; totalDwell: number }>();
  for (const e of safeEvents) {
    const idx = e.slide_index as number;
    const existing = slideMap.get(idx);
    if (existing) {
      existing.count += 1;
      existing.totalDwell += e.dwell_time_ms ?? 0;
    } else {
      slideMap.set(idx, { type: e.slide_type, count: 1, totalDwell: e.dwell_time_ms ?? 0 });
    }
  }
  const slideBreakdown: SlideAnalytics[] = Array.from(slideMap.entries())
    .map(([slideIndex, { type, count, totalDwell }]) => ({
      slideIndex,
      slideType: type,
      viewCount: count,
      avgDwellMs: count > 0 ? Math.round(totalDwell / count) : 0,
    }))
    .sort((a, b) => a.slideIndex - b.slideIndex);

  // Device breakdown
  const deviceMap = new Map<string, number>();
  for (const v of safeViews) {
    const d = v.device_type ?? 'unknown';
    deviceMap.set(d, (deviceMap.get(d) ?? 0) + 1);
  }
  const deviceBreakdown = Array.from(deviceMap.entries()).map(([deviceType, count]) => ({
    deviceType,
    count,
  }));

  // Top countries
  const countryMap = new Map<string, number>();
  for (const v of safeViews) {
    if (!v.country) continue;
    countryMap.set(v.country, (countryMap.get(v.country) ?? 0) + 1);
  }
  const topCountries = Array.from(countryMap.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top referrers
  const referrerMap = new Map<string, number>();
  for (const v of safeViews) {
    if (!v.referrer) continue;
    let domain = v.referrer;
    try {
      domain = new URL(v.referrer).hostname;
    } catch {
      // keep raw referrer
    }
    referrerMap.set(domain, (referrerMap.get(domain) ?? 0) + 1);
  }
  const topReferrers = Array.from(referrerMap.entries())
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Recent views (last 20)
  const recentViews: RecentView[] = safeViews.slice(0, 20).map((v) => ({
    id: v.id as string,
    visitorId: v.visitor_id as string,
    deviceType: v.device_type as string | null,
    browser: v.browser as string | null,
    country: v.country as string | null,
    city: v.city as string | null,
    maxSlideReached: v.max_slide_reached as number,
    slidesTotal: v.slides_total as number,
    durationMs: v.duration_ms as number,
    createdAt: v.created_at as string,
  }));

  return {
    totalViews,
    uniqueVisitors,
    avgDurationMs,
    avgScrollDepthPct,
    viewsByDay,
    slideBreakdown,
    deviceBreakdown,
    topCountries,
    topReferrers,
    recentViews,
  };
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  data: null,
  loading: false,
  error: null,
  proposalId: null,

  clearAnalytics: () => set({ data: null, error: null, proposalId: null }),

  fetchProposalAnalytics: async (proposalId: string) => {
    set({ loading: true, error: null, proposalId });

    try {
      // Try server-side first, fall back to client-side
      const rpcResult = await fetchViaRpc(proposalId);
      const data = rpcResult ?? await fetchClientSide(proposalId);

      set({ loading: false, data });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : 'Failed to load analytics.' });
    }
  },
}));

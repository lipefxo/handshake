/**
 * Compute a simple engagement level from proposal analytics summary data.
 * hot   = viewed in last 3 days with decent depth
 * warm  = viewed in last 7 days
 * cold  = viewed more than 7 days ago or never
 */
export type EngagementLevel = 'hot' | 'warm' | 'cold' | 'none';

export interface EngagementSummary {
  totalViews: number;
  lastViewedAt: string | null;
  avgScrollDepthPct: number;
}

export function computeEngagementLevel(summary: EngagementSummary): EngagementLevel {
  if (summary.totalViews === 0 || !summary.lastViewedAt) return 'none';

  const now = Date.now();
  const lastViewed = new Date(summary.lastViewedAt).getTime();
  const daysSinceView = (now - lastViewed) / (1000 * 60 * 60 * 24);

  if (daysSinceView <= 3 && (summary.avgScrollDepthPct >= 40 || summary.totalViews >= 3)) {
    return 'hot';
  }
  if (daysSinceView <= 7) {
    return 'warm';
  }
  return 'cold';
}

export const ENGAGEMENT_CONFIG: Record<EngagementLevel, { label: string; color: string; bgColor: string; dotColor: string }> = {
  hot: { label: 'Hot', color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200', dotColor: 'bg-orange-400' },
  warm: { label: 'Warm', color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200', dotColor: 'bg-amber-400' },
  cold: { label: 'Cold', color: 'text-blue-500', bgColor: 'bg-blue-50 border-blue-200', dotColor: 'bg-blue-400' },
  none: { label: '', color: 'text-gray-400', bgColor: '', dotColor: 'bg-gray-300' },
};

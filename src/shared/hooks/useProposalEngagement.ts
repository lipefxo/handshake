import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { computeEngagementLevel, type EngagementLevel, type EngagementSummary } from '../utils/engagementScore';

export interface ProposalEngagementMap {
  [proposalId: string]: {
    level: EngagementLevel;
    totalViews: number;
    lastViewedAt: string | null;
  };
}

/**
 * Fetches lightweight engagement summaries for all published proposals in a workspace.
 * Uses a single query to get aggregated view counts.
 */
export function useProposalEngagement(proposalIds: string[]): {
  engagement: ProposalEngagementMap;
  loading: boolean;
} {
  const [engagement, setEngagement] = useState<ProposalEngagementMap>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (proposalIds.length === 0) {
      setEngagement({});
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // Fetch basic view data per proposal — just counts and latest timestamp
        const { data, error } = await supabase
          .from('proposal_views')
          .select('proposal_id, max_slide_reached, slides_total, created_at')
          .in('proposal_id', proposalIds)
          .order('created_at', { ascending: false });

        if (error || cancelled) return;

        // Aggregate per proposal
        const map: Record<string, { views: number; lastAt: string | null; depths: number[] }> = {};
        for (const row of (data ?? [])) {
          const pid = row.proposal_id as string;
          if (!map[pid]) {
            map[pid] = { views: 0, lastAt: null, depths: [] };
          }
          map[pid].views++;
          if (!map[pid].lastAt) map[pid].lastAt = row.created_at as string;
          const total = (row.slides_total as number) || 1;
          const reached = (row.max_slide_reached as number) || 0;
          map[pid].depths.push(((reached + 1) / total) * 100);
        }

        const result: ProposalEngagementMap = {};
        for (const pid of proposalIds) {
          const info = map[pid];
          if (!info) {
            result[pid] = { level: 'none', totalViews: 0, lastViewedAt: null };
            continue;
          }
          const avgDepth = info.depths.length > 0
            ? Math.round(info.depths.reduce((a, b) => a + b, 0) / info.depths.length)
            : 0;
          const summary: EngagementSummary = {
            totalViews: info.views,
            lastViewedAt: info.lastAt,
            avgScrollDepthPct: avgDepth,
          };
          result[pid] = {
            level: computeEngagementLevel(summary),
            totalViews: info.views,
            lastViewedAt: info.lastAt,
          };
        }

        if (!cancelled) {
          setEngagement(result);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [proposalIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return { engagement, loading };
}

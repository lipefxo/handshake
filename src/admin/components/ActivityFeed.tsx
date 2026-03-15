import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { formatRelativeTime } from '../../shared/utils/helpers';
import { AppIcon } from '../../shared/icons/AppIcon';

interface ActivityItem {
  id: string;
  type: 'view' | 'created' | 'published' | 'updated';
  proposalTitle: string;
  proposalId: string;
  detail?: string;
  timestamp: string;
}

const ACTIVITY_ICONS = {
  view: 'ui.globe',
  created: 'ui.add',
  published: 'ui.check',
  updated: 'ui.refresh',
} as const;

const ACTIVITY_COLORS = {
  view: 'text-blue-500 bg-blue-50',
  created: 'text-green-500 bg-green-50',
  published: 'text-emerald-500 bg-emerald-50',
  updated: 'text-gray-500 bg-gray-100',
} as const;

export function ActivityFeed({ limit = 20 }: { limit?: number }) {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspace?.id);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // Fetch recent views with proposal titles
        const { data: viewData } = await supabase
          .from('proposal_views')
          .select('id, proposal_id, created_at, country, device_type, proposals!inner(title, workspace_id)')
          .eq('proposals.workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (cancelled) return;

        const viewItems: ActivityItem[] = (viewData ?? []).map((row) => {
          const proposals = row.proposals as unknown as { title: string } | null;
          const country = row.country as string | undefined;
          const device = row.device_type as string | undefined;
          const parts: string[] = [];
          if (country) parts.push(country);
          if (device) parts.push(device);

          return {
            id: `view-${row.id}`,
            type: 'view' as const,
            proposalTitle: proposals?.title ?? 'Unknown',
            proposalId: row.proposal_id as string,
            detail: parts.length > 0 ? parts.join(' · ') : undefined,
            timestamp: row.created_at as string,
          };
        });

        // Fetch recent proposal changes
        const { data: proposalData } = await supabase
          .from('proposals')
          .select('id, title, status, created_at, updated_at')
          .eq('workspace_id', workspaceId)
          .order('updated_at', { ascending: false })
          .limit(limit);

        if (cancelled) return;

        const proposalItems: ActivityItem[] = (proposalData ?? []).flatMap((row) => {
          const items: ActivityItem[] = [];
          const createdAt = row.created_at as string;
          const updatedAt = row.updated_at as string;
          const title = row.title as string;
          const id = row.id as string;
          const status = row.status as string;

          // Created event
          items.push({
            id: `created-${id}`,
            type: 'created',
            proposalTitle: title,
            proposalId: id,
            timestamp: createdAt,
          });

          // Published event (if published and updated_at differs from created_at)
          if (status === 'published' && updatedAt !== createdAt) {
            items.push({
              id: `published-${id}`,
              type: 'published',
              proposalTitle: title,
              proposalId: id,
              timestamp: updatedAt,
            });
          }

          return items;
        });

        // Merge and sort by timestamp
        const all = [...viewItems, ...proposalItems]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);

        if (!cancelled) {
          setItems(all);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [workspaceId, limit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xs text-gray-400">No recent activity.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3 py-2.5 px-1">
          <div className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center ${ACTIVITY_COLORS[item.type]}`}>
            <AppIcon icon={ACTIVITY_ICONS[item.type]} className="w-3 h-3" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-700">
              {item.type === 'view' && (
                <>
                  <span className="font-medium">{item.proposalTitle}</span> was viewed
                  {item.detail && <span className="text-gray-400"> ({item.detail})</span>}
                </>
              )}
              {item.type === 'created' && (
                <>
                  <span className="font-medium">{item.proposalTitle}</span> was created
                </>
              )}
              {item.type === 'published' && (
                <>
                  <span className="font-medium">{item.proposalTitle}</span> was published
                </>
              )}
              {item.type === 'updated' && (
                <>
                  <span className="font-medium">{item.proposalTitle}</span> was updated
                </>
              )}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {formatRelativeTime(item.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

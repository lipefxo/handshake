import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAnalyticsStore } from '../../store/analyticsStore';
import { useProposalStore } from '../../store/proposalStore';
import { SegmentedTabs } from '../../shared/components/SegmentedTabs';
import { AppIcon } from '../../shared/icons/AppIcon';
import { Input } from '@/components/ui/input';

const DEVICE_COLORS: Record<string, string> = {
  desktop: '#6366f1',
  mobile: '#10b981',
  tablet: '#f59e0b',
  unknown: '#9ca3af',
};

function formatDuration(ms: number): string {
  if (ms < 1000) return '<1s';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-gray-700 mb-3">{children}</h3>
  );
}

export function ProposalAnalytics() {
  const { id } = useParams<{ id: string }>();
  const { proposals, fetchProposals } = useProposalStore();
  const { data, loading, error, fetchProposalAnalytics, clearAnalytics } = useAnalyticsStore();

  const proposal = proposals.find((p) => p.id === id) ?? null;

  useEffect(() => {
    if (proposals.length === 0) void fetchProposals();
  }, [fetchProposals, proposals.length]);

  useEffect(() => {
    if (!id) return;
    void fetchProposalAnalytics(id);
    return () => clearAnalytics();
  }, [id, fetchProposalAnalytics, clearAnalytics]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="grid grid-cols-[11rem_minmax(0,1fr)_22rem] items-center gap-4 px-4 py-2.5 border-b border-gray-100 bg-white flex-shrink-0">
        <SegmentedTabs
          value="analytics"
          className="w-44 flex-shrink-0"
          tabClassName="flex-1"
          indicatorLayoutId="proposal-editor-mode-tabs"
          options={[
            { value: 'slides', label: 'Slides', href: `/admin/proposals/${id}` },
            { value: 'settings', label: 'Settings', href: `/admin/proposals/${id}/settings` },
            { value: 'analytics', label: 'Analytics' },
          ]}
        />

        <div className="min-w-0 flex flex-col items-center justify-center gap-0.5">
          {proposal ? (
            <>
              <Input
                className="h-7 border-0 bg-transparent px-2 py-0.5 text-sm font-semibold text-center text-gray-900 shadow-none focus-visible:ring-0 min-w-0 w-full max-w-xl"
                value={proposal.title}
                readOnly
              />
              <span className="text-xs text-gray-400">{proposal.partnerName}</span>
            </>
          ) : (
            <span className="text-sm text-gray-400">Analytics</span>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => id && void fetchProposalAnalytics(id)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
          >
            <AppIcon icon="ui.refresh" className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Body */}
      <motion.div
        className="flex-1 overflow-auto admin-scroll"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
      >
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
          {loading && (
            <div className="flex items-center justify-center py-24">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && !data && (
            <div className="text-center py-24">
              <p className="text-4xl mb-4 opacity-20">◎</p>
              <p className="text-sm text-gray-500">No analytics data yet.</p>
              <p className="text-xs text-gray-400 mt-1">Share your proposal to start collecting views.</p>
            </div>
          )}

          {!loading && data && (
            <>
              {/* Overview cards */}
              <div>
                <SectionTitle>Overview</SectionTitle>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard label="Total views" value={data.totalViews} />
                  <StatCard label="Unique visitors" value={data.uniqueVisitors} />
                  <StatCard
                    label="Avg. time"
                    value={formatDuration(data.avgDurationMs)}
                    sub="per session"
                  />
                  <StatCard
                    label="Avg. depth"
                    value={`${data.avgScrollDepthPct}%`}
                    sub="slides reached"
                  />
                </div>
              </div>

              {/* Views over time */}
              {data.viewsByDay.length > 0 && (
                <div>
                  <SectionTitle>Views over time</SectionTitle>
                  <div className="rounded-xl border border-gray-100 bg-white p-5">
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={data.viewsByDay} barSize={8}>
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: '#9ca3af' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v: string) => v.slice(5)}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#9ca3af' }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                          cursor={{ fill: '#f3f4f6' }}
                        />
                        <Bar dataKey="views" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Slide breakdown */}
              {data.slideBreakdown.length > 0 && (
                <div>
                  <SectionTitle>Slide engagement</SectionTitle>
                  <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-50">
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400">#</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400">Type</th>
                          <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-400">Views</th>
                          <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-400">Avg. time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.slideBreakdown.map((slide, i) => {
                          const maxViews = Math.max(...data.slideBreakdown.map((s) => s.viewCount));
                          const isMost = slide.viewCount === maxViews && slide.viewCount > 0;
                          return (
                            <tr
                              key={slide.slideIndex}
                              className={`border-b border-gray-50 last:border-0 ${isMost ? 'bg-indigo-50/40' : ''}`}
                            >
                              <td className="px-4 py-2.5 text-gray-400">{slide.slideIndex + 1}</td>
                              <td className="px-4 py-2.5 text-gray-700 capitalize flex items-center gap-1.5">
                                {slide.slideType ?? '—'}
                                {isMost && (
                                  <span className="text-[10px] font-medium text-indigo-500 bg-indigo-100 px-1.5 py-0.5 rounded-full">
                                    Most visited
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-right text-gray-700">{slide.viewCount}</td>
                              <td className="px-4 py-2.5 text-right text-gray-500">
                                {formatDuration(slide.avgDwellMs)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Device + Locations row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Device breakdown */}
                {data.deviceBreakdown.length > 0 && (
                  <div>
                    <SectionTitle>Devices</SectionTitle>
                    <div className="rounded-xl border border-gray-100 bg-white p-5">
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie
                            data={data.deviceBreakdown}
                            dataKey="count"
                            nameKey="deviceType"
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={3}
                          >
                            {data.deviceBreakdown.map((entry) => (
                              <Cell
                                key={entry.deviceType}
                                fill={DEVICE_COLORS[entry.deviceType] ?? '#9ca3af'}
                              />
                            ))}
                          </Pie>
                          <Legend
                            iconType="circle"
                            iconSize={8}
                            formatter={(v: string) => (
                              <span className="text-xs text-gray-600 capitalize">{v}</span>
                            )}
                          />
                          <Tooltip
                            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Top locations */}
                {data.topCountries.length > 0 && (
                  <div>
                    <SectionTitle>Top locations</SectionTitle>
                    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                      {data.topCountries.map((c, i) => (
                        <div
                          key={c.country}
                          className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0"
                        >
                          <span className="text-sm text-gray-700">{c.country}</span>
                          <span className="text-sm text-gray-400">{c.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Referrers */}
              {data.topReferrers.length > 0 && (
                <div>
                  <SectionTitle>Top referrers</SectionTitle>
                  <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                    {data.topReferrers.map((r) => (
                      <div
                        key={r.referrer}
                        className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0"
                      >
                        <span className="text-sm text-gray-700">{r.referrer}</span>
                        <span className="text-sm text-gray-400">{r.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent views */}
              {data.recentViews.length > 0 && (
                <div>
                  <SectionTitle>Recent views</SectionTitle>
                  <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-50">
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400">Time</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400">Device</th>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400">Location</th>
                          <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-400">Depth</th>
                          <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-400">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentViews.map((v) => {
                          const depthPct =
                            v.slidesTotal > 0
                              ? Math.round(((v.maxSlideReached + 1) / v.slidesTotal) * 100)
                              : 0;
                          const location = [v.city, v.country].filter(Boolean).join(', ') || '—';
                          const timeAgo = new Date(v.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          });
                          return (
                            <tr key={v.id} className="border-b border-gray-50 last:border-0">
                              <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{timeAgo}</td>
                              <td className="px-4 py-2.5 text-gray-700 capitalize">
                                {[v.browser, v.deviceType].filter(Boolean).join(' · ') || '—'}
                              </td>
                              <td className="px-4 py-2.5 text-gray-500">{location}</td>
                              <td className="px-4 py-2.5 text-right text-gray-500">{depthPct}%</td>
                              <td className="px-4 py-2.5 text-right text-gray-500">
                                {formatDuration(v.durationMs)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

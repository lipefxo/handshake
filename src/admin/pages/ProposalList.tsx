import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useProposalStore } from '../../store/proposalStore';
import { useAuthStore } from '../../store/authStore';
import type { Proposal } from '../../types/proposal';
import { generateSlug, formatRelativeTime, copyToClipboard } from '../../shared/utils/helpers';
import { createDefaultProposalSlides } from '../../data/slideDefaults';

export function ProposalList() {
  const { proposals, loading, fetchProposals, createProposal, deleteProposal } = useProposalStore();
  const { user } = useAuthStore();
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleCreate = async () => {
    if (!user) return;
    setCreating(true);
    const partnerName = 'New Partner';
    await createProposal({
      user_id: user.id,
      slug: generateSlug(partnerName),
      title: 'Untitled Proposal',
      partnerName,
      status: 'draft',
      slides: createDefaultProposalSlides(),
    });
    setCreating(false);
  };

  const handleCopyLink = async (proposal: Proposal) => {
    const url = `${window.location.origin}/p/${proposal.slug}`;
    await copyToClipboard(url);
    setCopiedId(proposal.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this proposal? This cannot be undone.')) {
      await deleteProposal(id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Proposals</h1>
          <p className="text-sm text-gray-500 mt-0.5">{proposals.length} total</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all"
        >
          {creating ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
          New proposal
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && proposals.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl"
        >
          <div className="text-4xl mb-4">◎</div>
          <h2 className="text-base font-semibold text-gray-700 mb-2">No proposals yet</h2>
          <p className="text-sm text-gray-400 mb-6">Create your first partnership proposal to get started.</p>
          <button
            onClick={handleCreate}
            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all"
          >
            Create proposal
          </button>
        </motion.div>
      )}

      {/* Proposals grid */}
      {!loading && proposals.length > 0 && (
        <div className="grid gap-3">
          {proposals.map((proposal, i) => (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-4 hover:border-gray-200 hover:shadow-sm transition-all"
            >
              {/* Status indicator */}
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${proposal.status === 'published' ? 'bg-green-400' : 'bg-gray-300'}`} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{proposal.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    proposal.status === 'published'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {proposal.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-400">{proposal.partnerName}</span>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-gray-400">{proposal.slides.filter(s => s.enabled).length} slides</span>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-gray-400">{formatRelativeTime(proposal.updatedAt || proposal.createdAt)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {proposal.status === 'published' && (
                  <button
                    onClick={() => handleCopyLink(proposal)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {copiedId === proposal.id ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy link
                      </>
                    )}
                  </button>
                )}

                <a
                  href={`/p/${proposal.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Preview"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>

                <Link
                  to={`/admin/proposals/${proposal.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-900 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Edit
                </Link>

                <button
                  onClick={() => handleDelete(proposal.id)}
                  className="p-1.5 text-gray-300 hover:text-red-400 rounded-lg hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

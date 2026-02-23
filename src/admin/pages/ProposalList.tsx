import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useProposalStore } from '../../store/proposalStore';
import { useAuthStore } from '../../store/authStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import type { Proposal, SlideConfig } from '../../types/proposal';
import { generateSlug, formatDateTime, formatRelativeTime, copyToClipboard } from '../../shared/utils/helpers';
import { MarkdownIngestorModal } from '../../ingestor/MarkdownIngestorModal';
import { useIngestorState } from '../../ingestor/hooks/useIngestorState';
import { NewProposalDialog, type NewProposalFormValues } from '../components/NewProposalDialog';
import { AppIcon } from '../../shared/icons/AppIcon';
import { SegmentedTabs } from '../../shared/components/SegmentedTabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function ProposalList() {
  const {
    proposals,
    loading,
    error,
    fetchProposals,
    createProposal,
    deleteProposal,
    createFromMarkdown,
    clearError,
  } = useProposalStore();
  const { user } = useAuthStore();
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspace?.id);
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Proposal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletedProposalTitle, setDeletedProposalTitle] = useState<string | null>(null);
  const [showNewProposalDialog, setShowNewProposalDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const ingestor = useIngestorState();

  const filteredProposals = statusFilter === 'all'
    ? proposals
    : proposals.filter((p) => p.status === statusFilter);
  const publishedCount = proposals.filter((p) => p.status === 'published').length;
  const draftCount = proposals.filter((p) => p.status === 'draft').length;

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals, workspaceId]);

  useEffect(() => {
    if (!deletedProposalTitle) return undefined;
    const timeoutId = window.setTimeout(() => {
      setDeletedProposalTitle(null);
    }, 2600);

    return () => window.clearTimeout(timeoutId);
  }, [deletedProposalTitle]);

  const handleOpenCreateDialog = () => {
    clearError();
    setShowNewProposalDialog(true);
  };

  const handleCreateFromDialog = async (values: NewProposalFormValues) => {
    if (!user || !workspaceId) return;

    const proposalTitle = values.title.trim();
    const partnerName = values.partnerName.trim();

    setCreating(true);
    try {
      const createdProposal = await createProposal({
        workspace_id: workspaceId,
        slug: generateSlug(partnerName),
        title: proposalTitle,
        partnerName,
        status: 'draft',
        slides: [],
        themeId: values.themeId,
      });

      if (createdProposal) {
        clearError();
        setShowNewProposalDialog(false);
        navigate(`/admin/proposals/${createdProposal.id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = async (proposal: Proposal) => {
    const url = proposal.shortCode
      ? `${window.location.origin}/s/${proposal.shortCode}`
      : `${window.location.origin}/p/${proposal.slug}`;
    await copyToClipboard(url);
    setCopiedId(proposal.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRequestDelete = (proposal: Proposal) => {
    setDeleteTarget(proposal);
  };

  const handleCancelDelete = () => {
    if (deletingId) return;
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const targetToDelete = deleteTarget;
    setDeletingId(targetToDelete.id);
    try {
      const didDelete = await deleteProposal(targetToDelete.id);
      setDeleteTarget(null);
      if (didDelete) {
        setDeletedProposalTitle(targetToDelete.title);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleMarkdownGenerate = useCallback(
    async (slides: SlideConfig[], frontmatter: { title?: string; partner?: string; date?: string; theme?: string }) => {
      clearError();

      if (!user) {
        throw new Error('You need to be signed in to generate a proposal.');
      }

      const newProposal = await createFromMarkdown(ingestor.editorContent, frontmatter, slides);
      if (newProposal) {
        ingestor.close();
        navigate(`/admin/proposals/${newProposal.id}`);
        return;
      }

      const storeError = useProposalStore.getState().error;
      throw new Error(storeError ?? 'Failed to generate proposal. Please try again.');
    },
    [clearError, createFromMarkdown, ingestor, navigate, user],
  );

  return (
    <div className="max-w-5xl mx-auto px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-brand-serif text-2xl text-gray-900">Proposals</h1>
          <p className="mt-1 text-sm text-[#6b6b6b]">{proposals.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleOpenCreateDialog}
            className="gap-2"
          >
            <AppIcon icon="ui.add" className="w-4 h-4" />
            New proposal
          </Button>
        </div>
      </div>

      {/* Status filter tabs */}
      {proposals.length > 0 && (
        <SegmentedTabs
          value={statusFilter}
          onValueChange={setStatusFilter}
          className="mb-5 w-fit border-0 bg-gray-100"
          options={[
            {
              value: 'all',
              label: (isActive: boolean) => (
                <>
                  All
                  <span className={isActive ? 'ml-1.5 text-gray-400' : 'ml-1.5 text-gray-400/60'}>
                    {proposals.length}
                  </span>
                </>
              ),
            },
            {
              value: 'published',
              label: (isActive: boolean) => (
                <>
                  Published
                  <span className={isActive ? 'ml-1.5 text-gray-400' : 'ml-1.5 text-gray-400/60'}>
                    {publishedCount}
                  </span>
                </>
              ),
            },
            {
              value: 'draft',
              label: (isActive: boolean) => (
                <>
                  Drafts
                  <span className={isActive ? 'ml-1.5 text-gray-400' : 'ml-1.5 text-gray-400/60'}>
                    {draftCount}
                  </span>
                </>
              ),
            },
          ]}
        />
      )}

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
          <div className="mb-4 flex justify-center">
            <AppIcon icon="ui.home" size={32} className="text-gray-400" />
          </div>
          <h2 className="font-brand-serif text-base text-gray-700 mb-2">No proposals yet</h2>
          <p className="mb-6 text-sm text-[#6b6b6b]">Create your first partnership proposal to get started.</p>
          <Button
            onClick={handleOpenCreateDialog}
          >
            Create proposal
          </Button>
        </motion.div>
      )}

      {/* Proposals grid */}
      {!loading && proposals.length > 0 && (
        <div className="grid gap-3">
          <AnimatePresence mode="popLayout">
          {filteredProposals.map((proposal, i) => (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ delay: i * 0.03 }}
              layout
              className="cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4785c]/50 focus-visible:ring-offset-2"
              role="link"
              tabIndex={0}
              onClick={() => navigate(`/admin/proposals/${proposal.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate(`/admin/proposals/${proposal.id}`);
                }
              }}
            >
              <Card className={`transition-all duration-150 hover:shadow-sm ${
                proposal.status === 'published'
                  ? 'border-green-100 hover:border-green-200 bg-green-50/30'
                  : 'hover:border-gray-200'
              }`}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    proposal.status === 'published'
                      ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.4)]'
                      : 'bg-gray-300'
                  }`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{proposal.title}</h3>
                      <Badge
                        variant={proposal.status === 'published' ? 'secondary' : 'outline'}
                        className={proposal.status === 'published' ? 'bg-green-100 text-green-700 border-green-200' : ''}
                      >
                        {proposal.status === 'published' ? 'Live' : 'Draft'}
                      </Badge>
                    </div>
                    <div className="mt-0 flex items-center gap-2.5">
                      <span className="text-xs text-gray-400">{proposal.partnerName}</span>
                      <span className="text-gray-200">·</span>
                      <span className="text-xs text-gray-400">{proposal.slides.filter(s => s.enabled).length} slides</span>
                    </div>
                    <p
                      className="mt-0.5 text-xs text-gray-400"
                      title={formatDateTime(proposal.updatedAt || proposal.createdAt)}
                    >
                      Last updated {formatRelativeTime(proposal.updatedAt || proposal.createdAt)}
                      {' '}
                      ({formatDateTime(proposal.updatedAt || proposal.createdAt)})
                    </p>
                  </div>

                  <div
                    className="flex items-center gap-1.5 flex-shrink-0"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    {proposal.status === 'published' && (
                      <Button
                        onClick={() => handleCopyLink(proposal)}
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                      >
                        {copiedId === proposal.id ? (
                          <>
                            <AppIcon icon="ui.check" className="w-3.5 h-3.5 text-green-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <AppIcon icon="ui.copy" className="w-3.5 h-3.5" />
                            Copy link
                          </>
                        )}
                      </Button>
                    )}

                    <Button asChild variant="ghost" size="icon" title="Preview">
                      <Link to={`/p/${proposal.slug}`}>
                        <AppIcon icon="ui.link-square-01" className="w-4 h-4" />
                      </Link>
                    </Button>

                    <Button
                      onClick={() => handleRequestDelete(proposal)}
                      disabled={deletingId === proposal.id}
                      variant="ghost"
                      size="icon"
                      title="Delete"
                      className="text-gray-400 hover:text-red-500"
                    >
                      <AppIcon icon="ui.delete" className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          </AnimatePresence>

          {filteredProposals.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-400">
                No {statusFilter === 'published' ? 'published' : 'draft'} proposals.
              </p>
            </div>
          )}
        </div>
      )}

      <MarkdownIngestorModal
        isOpen={ingestor.isOpen}
        mode={ingestor.mode}
        editorContent={ingestor.editorContent}
        onContentChange={ingestor.setEditorContent}
        onCursorChange={ingestor.setCursorPosition}
        onGenerate={handleMarkdownGenerate}
        generationError={error}
        onClose={ingestor.close}
      />

      <NewProposalDialog
        isOpen={showNewProposalDialog}
        isCreating={creating}
        createError={error}
        onClose={() => {
          clearError();
          setShowNewProposalDialog(false);
        }}
        onCreate={handleCreateFromDialog}
        onCreateFromMarkdown={() => {
          clearError();
          setShowNewProposalDialog(false);
          ingestor.open('new');
        }}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) handleCancelDelete(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-brand-serif">Delete proposal?</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-[#6b6b6b]">
              This will permanently delete{' '}
              <span className="font-medium text-gray-700">{deleteTarget?.title}</span>.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelDelete}
              disabled={Boolean(deletingId)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              disabled={Boolean(deletingId)}
              variant="destructive"
              className="inline-flex items-center gap-2"
            >
              {deletingId ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {deletedProposalTitle && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="fixed right-6 top-6 z-50 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-2 text-sm text-emerald-800">
              <AppIcon icon="ui.check" className="h-4 w-4 text-emerald-600" />
              <span>
                Deleted
                {' '}
                <span className="font-medium">{deletedProposalTitle}</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

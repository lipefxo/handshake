import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useProposalStore } from '../../store/proposalStore';
import { useAuthStore } from '../../store/authStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import type { Proposal, ProposalOutcome, SlideConfig } from '../../types/proposal';
import { generateSlug, formatDateTime, formatRelativeTime, copyToClipboard } from '../../shared/utils/helpers';
import { MarkdownIngestorModal } from '../../ingestor/MarkdownIngestorModal';
import { useIngestorState } from '../../ingestor/hooks/useIngestorState';
import { NewProposalDialog, type NewProposalFormValues } from '../components/NewProposalDialog';
import { getTemplateSlidesForProposal } from '../../data/proposalTemplates';
import { createDefaultProposalSlides } from '../../data/slideDefaults';
import { useCustomTemplateStore, getCustomTemplateSlidesForProposal } from '../../store/customTemplateStore';
import { useProposalEngagement } from '../../shared/hooks/useProposalEngagement';
import { ENGAGEMENT_CONFIG } from '../../shared/utils/engagementScore';
import { AppIcon } from '../../shared/icons/AppIcon';
import { ActivityFeed } from '../components/ActivityFeed';
import { SegmentedTabs } from '../../shared/components/SegmentedTabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ProposalList() {
  const {
    proposals,
    loading,
    error,
    fetchProposals,
    createProposal,
    updateProposal,
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
  const [showActivity, setShowActivity] = useState(false);
  const ingestor = useIngestorState();

  const filteredProposals = statusFilter === 'all'
    ? proposals
    : proposals.filter((p) => p.status === statusFilter);
  const publishedCount = proposals.filter((p) => p.status === 'published').length;
  const draftCount = proposals.filter((p) => p.status === 'draft').length;

  const publishedIds = useMemo(
    () => proposals.filter((p) => p.status === 'published').map((p) => p.id),
    [proposals],
  );
  const { engagement } = useProposalEngagement(publishedIds);

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
      let slides: SlideConfig[] = [];
      let themeId = values.themeId;

      if (values.templateId?.startsWith('custom:')) {
        const customId = values.templateId.replace('custom:', '');
        const ct = useCustomTemplateStore.getState().templates.find((t) => t.id === customId);
        if (ct) {
          const templateData = getCustomTemplateSlidesForProposal(ct, {
            title: proposalTitle,
            partnerName,
            proposalDate: values.proposalDate,
            themeId: values.themeId,
          });
          slides = templateData.slides;
          themeId = templateData.themeId;
        }
      } else if (values.templateId) {
        const templateData = getTemplateSlidesForProposal(values.templateId, {
          title: proposalTitle,
          partnerName,
          proposalDate: values.proposalDate,
          themeId: values.themeId,
        });
        if (templateData) {
          slides = templateData.slides;
          themeId = templateData.themeId;
        }
      } else {
        slides = createDefaultProposalSlides({
          title: proposalTitle,
          partnerName,
          proposalDate: values.proposalDate,
          themeId: values.themeId,
        });
      }

      const createdProposal = await createProposal({
        workspace_id: workspaceId,
        slug: generateSlug(partnerName),
        title: proposalTitle,
        partnerName,
        status: 'draft',
        slides,
        themeId,
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

  const handleSetOutcome = async (proposal: Proposal, outcome: ProposalOutcome) => {
    try {
      await updateProposal(proposal.id, { outcome });
    } catch {
      // error is set in the store
    }
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
                      {proposal.outcome && proposal.outcome !== 'active' && (
                        <Badge
                          variant="outline"
                          className={
                            proposal.outcome === 'won' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            proposal.outcome === 'lost' ? 'bg-red-50 text-red-600 border-red-200' :
                            'bg-gray-50 text-gray-500 border-gray-200'
                          }
                        >
                          {proposal.outcome === 'won' ? 'Won' :
                           proposal.outcome === 'lost' ? 'Lost' : 'Archived'}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0 flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs text-gray-400">{proposal.partnerName}</span>
                      <span className="text-gray-200">·</span>
                      <span className="text-xs text-gray-400">{proposal.slides.filter(s => s.enabled).length} slides</span>
                      {(() => {
                        const eng = engagement[proposal.id];
                        if (!eng || eng.level === 'none') return null;
                        const config = ENGAGEMENT_CONFIG[eng.level];
                        return (
                          <>
                            <span className="text-gray-200">·</span>
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${config.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
                              {config.label}
                              <span className="text-gray-400 font-normal">({eng.totalViews} {eng.totalViews === 1 ? 'view' : 'views'})</span>
                            </span>
                          </>
                        );
                      })()}
                      {(() => {
                        if (!proposal.expiresAt) return null;
                        const expiresAt = new Date(proposal.expiresAt);
                        const now = new Date();
                        const daysUntil = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        if (daysUntil < 0) {
                          return (
                            <>
                              <span className="text-gray-200">·</span>
                              <span className="text-xs font-medium text-red-500">Expired</span>
                            </>
                          );
                        }
                        if (daysUntil <= 7) {
                          return (
                            <>
                              <span className="text-gray-200">·</span>
                              <span className="text-xs font-medium text-amber-600">
                                Expires in {daysUntil} {daysUntil === 1 ? 'day' : 'days'}
                              </span>
                            </>
                          );
                        }
                        return null;
                      })()}
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

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="More actions"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <AppIcon icon="ui.more" className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuLabel className="text-xs text-gray-400 font-normal">Outcome</DropdownMenuLabel>
                        {([
                          { value: 'active' as const, label: 'Active', className: 'text-gray-700' },
                          { value: 'won' as const, label: 'Won', className: 'text-emerald-600' },
                          { value: 'lost' as const, label: 'Lost', className: 'text-red-500' },
                          { value: 'archived' as const, label: 'Archived', className: 'text-gray-400' },
                        ]).map((option) => (
                          <DropdownMenuItem
                            key={option.value}
                            onClick={() => handleSetOutcome(proposal, option.value)}
                            className="gap-2"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              option.value === 'won' ? 'bg-emerald-500' :
                              option.value === 'lost' ? 'bg-red-400' :
                              option.value === 'archived' ? 'bg-gray-300' :
                              'bg-blue-400'
                            }`} />
                            <span className={option.className}>{option.label}</span>
                            {(proposal.outcome || 'active') === option.value && (
                              <AppIcon icon="ui.check" className="w-3.5 h-3.5 ml-auto text-gray-400" />
                            )}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRequestDelete(proposal)}
                          disabled={deletingId === proposal.id}
                          variant="destructive"
                        >
                          <AppIcon icon="ui.delete" className="w-4 h-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      {/* Activity feed */}
      {!loading && proposals.length > 0 && (
        <div className="mt-8 border-t border-gray-100 pt-6">
          <button
            type="button"
            onClick={() => setShowActivity(!showActivity)}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            <AppIcon icon="ui.chevron-right" className={`w-3.5 h-3.5 transition-transform ${showActivity ? 'rotate-90' : ''}`} />
            Recent Activity
          </button>
          {showActivity && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 overflow-hidden"
            >
              <ActivityFeed limit={15} />
            </motion.div>
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

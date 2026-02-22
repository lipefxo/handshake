import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import bcrypt from 'bcryptjs';
import { useProposalStore } from '../../store/proposalStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import type { Proposal, SlideConfig, SlideType, TitleSlideContent } from '../../types/proposal';
import { SlideSortableList } from '../components/SlideSortableList';
import { SlideConfigurator } from '../components/SlideConfigurator';
import { createDefaultSlide } from '../../data/slideDefaults';
import { copyToClipboard } from '../../shared/utils/helpers';
import { MarkdownIngestorModal } from '../../ingestor/MarkdownIngestorModal';
import { useIngestorState } from '../../ingestor/hooks/useIngestorState';
import { ProposalMarkdownEditorModal } from '../components/ProposalMarkdownEditorModal';
import { PublishSuccessModal } from '../components/PublishSuccessModal';
import { defaultThemeId, themes } from '../../themes/themeDefinitions';
import { AppIcon } from '../../shared/icons/AppIcon';
import { SegmentedTabs } from '../../shared/components/SegmentedTabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const AUTOSAVE_DELAY = 800;
const PREVIEW_SCALE = 0.7;
const PREVIEW_SCALE_INVERSE = 1 / PREVIEW_SCALE;

export function ProposalEditor() {
  const { id } = useParams<{ id: string }>();
  const {
    proposals,
    loading: proposalsLoading,
    error: proposalsError,
    fetchProposals,
    updateProposal,
    importMarkdownToProposal,
  } = useProposalStore();
  const workspaceCompanyName = useWorkspaceStore((state) => state.currentWorkspace?.companyName ?? '');
  const ingestor = useIngestorState();

  const editorValues = {
    autosave: {
      enabled: true,
    },
    preview: {
      showPanel: true,
    },
  };

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [markdownEditorOpen, setMarkdownEditorOpen] = useState(false);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [publishVisibility, setPublishVisibility] = useState<Proposal['visibility']>('public');
  const [publishPasswordInput, setPublishPasswordInput] = useState('');
  const [publishing, setPublishing] = useState(false);
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);
  const hydratedProposalIdRef = useRef<string | null>(null);

  useEffect(() => {
    const p = proposals.find((p) => p.id === id);
    if (p && hydratedProposalIdRef.current !== p.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProposal({ ...p });
      hydratedProposalIdRef.current = p.id;
      setHasUnsavedChanges(false);
      if (!selectedSlideId && p.slides.length > 0) {
        setSelectedSlideId(p.slides[0].id);
      }
    }
  }, [id, proposals]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (id && hydratedProposalIdRef.current !== id) {
      hydratedProposalIdRef.current = null;
      setProposal(null);
      setHasUnsavedChanges(false);
    }
  }, [id]);

  useEffect(() => {
    if (proposals.length > 0) return;
    void fetchProposals();
  }, [fetchProposals, proposals.length]);

  const selectedSlide = proposal?.slides.find((s) => s.id === selectedSlideId) ?? null;
  const selectedSlideIndex = proposal?.slides.findIndex((s) => s.id === selectedSlideId) ?? -1;
  const hasPrevSlide = selectedSlideIndex > 0;
  const hasNextSlide = proposal ? selectedSlideIndex >= 0 && selectedSlideIndex < proposal.slides.length - 1 : false;

  const save = useCallback(
    async (updatedProposal: Proposal): Promise<boolean> => {
      setSaveState('saving');
      try {
        const brandOverrides = {
          ...updatedProposal.brandOverrides,
          companyName: workspaceCompanyName || updatedProposal.brandOverrides?.companyName,
        };
        await updateProposal(updatedProposal.id, {
          title: updatedProposal.title,
          partnerName: updatedProposal.partnerName,
          slug: updatedProposal.slug,
          status: updatedProposal.status,
          slides: updatedProposal.slides,
          themeId: updatedProposal.themeId,
          visibility: updatedProposal.visibility,
          accessPassword: updatedProposal.accessPassword,
          expiresAt: updatedProposal.expiresAt,
          brandOverrides,
        });
        setSaveState('saved');
        setHasUnsavedChanges(false);
        setTimeout(() => setSaveState('idle'), 2000);
        return true;
      } catch {
        setSaveState('error');
        return false;
      }
    },
    [updateProposal, workspaceCompanyName]
  );

  useEffect(() => {
    if (!proposal || !editorValues.autosave.enabled || !hasUnsavedChanges) return;
    const timer = setTimeout(() => void save(proposal), AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
  }, [proposal, save, editorValues.autosave.enabled, hasUnsavedChanges]);

  const sendPreviewMessage = useCallback((p: Proposal, slideId: string | null, targetWindow?: Window | null) => {
    const message = {
      type: 'handshake-editor-preview-update',
      proposal: p,
      selectedSlideId: slideId,
    };
    const iframeWindow = previewIframeRef.current?.contentWindow;
    iframeWindow?.postMessage(message, window.location.origin);
    targetWindow?.postMessage(message, window.location.origin);
  }, []);

  const updateLocal = (updates: Partial<Proposal>) => {
    setProposal((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      queueMicrotask(() => sendPreviewMessage(next, selectedSlideId));
      return next;
    });
    setHasUnsavedChanges(true);
  };

  const updateSlide = (slideId: string, updates: Partial<SlideConfig>) => {
    if (!proposal) return;
    const slides = proposal.slides.map((s) => s.id === slideId ? { ...s, ...updates } : s);
    updateLocal({ slides });
  };

  const handleToggleSlide = (id: string) => {
    const slide = proposal?.slides.find((s) => s.id === id);
    if (slide) updateSlide(id, { enabled: !slide.enabled });
  };

  const handleDeleteSlide = (id: string) => {
    if (!proposal) return;
    const slides = proposal.slides.filter((s) => s.id !== id);
    updateLocal({ slides });
    if (selectedSlideId === id) {
      setSelectedSlideId(slides[0]?.id ?? null);
    }
  };

  const handleAddSlide = (type: SlideType) => {
    if (!proposal) return;
    const themeTransition = themes[proposal.themeId ?? defaultThemeId].style.slideTransitionDefault;
    const newSlide = { ...createDefaultSlide(type), transition: themeTransition };
    const slides = [...proposal.slides, newSlide];
    updateLocal({ slides });
    setSelectedSlideId(newSlide.id);
  };

  const handleRenameSlide = (slideId: string, label: string) => {
    updateSlide(slideId, { customLabel: label });
  };

  const handleRenameGroup = (groupId: string, title: string) => {
    if (!proposal) return;
    const slides = proposal.slides.map((slide) =>
      slide.groupId === groupId ? { ...slide, groupTitle: title } : slide
    );
    updateLocal({ slides });
  };

  const handleAssignSlideGroup = (slideId: string, groupId: string | null) => {
    if (!proposal) return;
    const targetGroupTitle = groupId
      ? proposal.slides.find((slide) => slide.groupId === groupId)?.groupTitle || 'Untitled group'
      : undefined;
    const slides = proposal.slides.map((slide) => {
      if (slide.id !== slideId) return slide;
      if (!groupId) return { ...slide, groupId: undefined, groupTitle: undefined };
      return { ...slide, groupId, groupTitle: targetGroupTitle };
    });
    updateLocal({ slides });
  };

  const handleGoToPrevSlide = useCallback(() => {
    if (!proposal || !hasPrevSlide) return;
    const prevSlide = proposal.slides[selectedSlideIndex - 1];
    if (prevSlide) setSelectedSlideId(prevSlide.id);
  }, [proposal, hasPrevSlide, selectedSlideIndex]);

  const handleGoToNextSlide = useCallback(() => {
    if (!proposal || !hasNextSlide) return;
    const nextSlide = proposal.slides[selectedSlideIndex + 1];
    if (nextSlide) setSelectedSlideId(nextSlide.id);
  }, [proposal, hasNextSlide, selectedSlideIndex]);

  const handlePublish = async () => {
    if (!proposal) return;
    if (proposal.status === 'published') {
      setShowUnpublishConfirm(true);
      return;
    }
    setPublishVisibility(proposal.visibility ?? 'public');
    setPublishPasswordInput('');
    setShowPublishConfirm(true);
  };

  const handleConfirmUnpublish = async () => {
    if (!proposal) return;
    const previousProposal = proposal;
    const nextProposal = { ...proposal, status: 'draft' as const };
    setProposal(nextProposal);
    const saved = await save(nextProposal);
    if (!saved) {
      setProposal(previousProposal);
      return;
    }
    setShowUnpublishConfirm(false);
  };

  const handleConfirmPublish = async () => {
    if (!proposal) return;
    setPublishing(true);
    try {
      const updates: Partial<Proposal> = {
        status: 'published',
        visibility: publishVisibility,
      };
      if (publishVisibility === 'password' && publishPasswordInput.trim()) {
        const hash = await bcrypt.hash(publishPasswordInput.trim(), 10);
        updates.accessPassword = hash;
      }
      const previousProposal = proposal;
      const nextProposal = { ...proposal, ...updates };
      setProposal(nextProposal);
      const saved = await save(nextProposal);
      if (!saved) {
        setProposal(previousProposal);
        return;
      }
      setShowPublishConfirm(false);
      setShowPublishSuccess(true);
      setPublishPasswordInput('');
    } finally {
      setPublishing(false);
    }
  };

  const handlePartnerNameChange = (value: string) => {
    if (!proposal) return;
    const slides = proposal.slides.map((slide) => {
      if (slide.type !== 'title') return slide;
      const titleContent = slide.content as TitleSlideContent;
      return {
        ...slide,
        content: {
          ...titleContent,
          partnerName: value,
        },
      };
    });
    updateLocal({ partnerName: value, slides });
  };

  const handleMarkdownImport = useCallback(
    async (newSlides: SlideConfig[]) => {
      if (!proposal) return;
      const mode = ingestor.mode === 'import' ? 'append' : 'replace';
      await importMarkdownToProposal(proposal.id, newSlides, mode);
      const updated = useProposalStore.getState().proposals.find((p) => p.id === proposal.id);
      if (updated) setProposal({ ...updated });
      ingestor.close();
    },
    [proposal, ingestor, importMarkdownToProposal],
  );

  const handleMarkdownApply = useCallback((slides: SlideConfig[]) => {
    updateLocal({ slides });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyLink = async () => {
    if (!proposal) return;
    const shareUrl = proposal.shortCode
      ? `${window.location.origin}/s/${proposal.shortCode}`
      : `${window.location.origin}/p/${proposal.slug}`;
    await copyToClipboard(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const proposalRef = useRef(proposal);
  proposalRef.current = proposal;
  const selectedSlideIdRef = useRef(selectedSlideId);
  selectedSlideIdRef.current = selectedSlideId;

  useEffect(() => {
    if (proposal) {
      sendPreviewMessage(proposal, selectedSlideId);
    }
  }, [selectedSlideId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handlePreviewReady = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'handshake-editor-preview-ready') return;
      const p = proposalRef.current;
      if (p) {
        sendPreviewMessage(p, selectedSlideIdRef.current, event.source instanceof Window ? event.source : null);
      }
    };

    window.addEventListener('message', handlePreviewReady);
    return () => window.removeEventListener('message', handlePreviewReady);
  }, [sendPreviewMessage]);

  if (!proposal && proposalsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">
            {proposalsError ? 'Could not load this proposal.' : 'Proposal not found.'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {proposalsError ? proposalsError : 'It may have been deleted or you may not have access.'}
          </p>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4785c]/50 focus-visible:ring-offset-2"
          >
            <AppIcon icon="ui.sidebar-toggle" className="w-3.5 h-3.5" />
            Back to proposals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="grid grid-cols-[11rem_minmax(0,1fr)_22rem] items-center gap-4 px-4 py-2.5 border-b border-gray-100 bg-white flex-shrink-0">
        {id && (
          <SegmentedTabs
            value="slides"
            className="w-44 flex-shrink-0"
            tabClassName="flex-1"
            options={[
              { value: 'slides', label: 'Slides' },
              { value: 'settings', label: 'Settings', href: `/admin/proposals/${id}/settings` },
            ]}
          />
        )}

        <div className="min-w-0 flex flex-col items-center justify-center gap-0.5">
          <Input
            className="h-7 border-0 bg-transparent px-2 py-0.5 text-sm font-semibold text-center text-gray-900 shadow-none focus-visible:bg-gray-50 focus-visible:ring-0 min-w-0 w-full max-w-xl"
            value={proposal.title}
            onChange={(e) => updateLocal({ title: e.target.value })}
            placeholder="Proposal title..."
          />
          <Input
            className="h-6 border-0 bg-transparent px-2 py-0 text-xs text-center text-gray-500 shadow-none focus-visible:bg-gray-50 focus-visible:ring-0 min-w-0 w-full max-w-sm"
            value={proposal.partnerName}
            onChange={(e) => handlePartnerNameChange(e.target.value)}
            placeholder="Partner name"
            aria-label="Partner name"
          />
        </div>

        <div className="w-[22rem] flex items-center justify-end gap-2">
          <div className="flex-shrink-0 flex items-center gap-1.5 min-w-[4.5rem] justify-end">
            <AnimatePresence mode="wait">
              {saveState === 'saving' && (
                <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-xs text-gray-400 flex items-center gap-1.5">
                  <span className="w-3 h-3 border border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                  Saving…
                </motion.span>
              )}
              {saveState === 'saved' && (
                <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-xs text-green-500 flex items-center gap-1">
                  <AppIcon icon="ui.check" className="w-3 h-3" />
                  Saved
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setMarkdownEditorOpen(true)}
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs"
              title="Edit proposal as Markdown"
            >
              <AppIcon icon="ui.file" className="w-3.5 h-3.5" />
              Markdown
            </Button>

            {proposal.status === 'published' && (
              <Button
                onClick={handleCopyLink}
                variant="secondary"
                size="sm"
                className="h-9 gap-1.5 text-xs"
              >
                {copiedLink ? (
                  <><AppIcon icon="ui.check" className="w-3.5 h-3.5 text-green-500" /> Copied!</>
                ) : (
                  <><AppIcon icon="ui.copy" className="w-3.5 h-3.5" /> Copy link</>
                )}
              </Button>
            )}

            <Button
              onClick={handlePublish}
              variant={proposal.status === 'published' ? 'destructive' : 'default'}
              className="h-9 px-4 text-xs font-semibold transition-all"
            >
              {proposal.status === 'published' ? 'Unpublish' : 'Publish'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main editor area */}
      <motion.div
        className="flex-1 flex overflow-hidden"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
      >
        {/* Slide list — left panel */}
        <div className="w-[19.5rem] min-h-0 flex-shrink-0 border-r border-gray-100 flex flex-col bg-gray-50/50">
          <div className="px-3 pt-3 pb-1 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-1">Slides</p>
            <span className="text-[11px] text-gray-400 px-1">{proposal.slides.filter((s) => s.enabled).length} active</span>
          </div>
          <SlideSortableList
            slides={proposal.slides}
            selectedId={selectedSlideId}
            onSelect={setSelectedSlideId}
            onReorder={(slides) => updateLocal({ slides })}
            onToggle={handleToggleSlide}
            onDelete={handleDeleteSlide}
            onAdd={handleAddSlide}
            onRenameSlide={handleRenameSlide}
            onRenameGroup={handleRenameGroup}
            onAssignGroup={handleAssignSlideGroup}
          />
        </div>

        {proposal.slides.length === 0 ? (
          <div className="flex-1 min-w-0 flex items-center justify-center bg-admin px-6">
            <div className="w-full max-w-md rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <AppIcon icon="slide.type.title" size={24} />
              </div>
              <h3 className="font-brand-serif text-base text-gray-900">Add your first slide to start</h3>
              <p className="mt-1.5 text-sm text-[#6b6b6b]">
                Build your presentation by adding a first slide, then customize content and order from the sidebar.
              </p>
              <Button
                type="button"
                onClick={() => handleAddSlide('title')}
                className="mt-5 inline-flex items-center gap-2"
              >
                <AppIcon icon="ui.add" className="h-3.5 w-3.5" />
                Add slide
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0 grid grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)] overflow-hidden">
            {/* Preview panel */}
            {editorValues.preview.showPanel && <div className="relative overflow-hidden bg-admin">
              <div className="h-full w-full max-w-[66rem] mx-auto border-x border-gray-100 bg-admin flex flex-col">
                <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Preview</span>
                  <button
                    type="button"
                    onClick={() => {
                      const iframe = previewIframeRef.current;
                      if (!iframe) return;
                      const frameWindow = iframe.contentWindow;
                      if (frameWindow) {
                        frameWindow.location.reload();
                        return;
                      }
                      iframe.src = iframe.src;
                    }}
                    className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    title="Refresh preview"
                  >
                    <AppIcon icon="ui.refresh" className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="relative flex-1 overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    {selectedSlide && selectedSlide.enabled ? (
                      <motion.div
                        key="preview-enabled"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="absolute inset-0 overflow-auto admin-scroll p-2.5 flex flex-col gap-2"
                      >
                        <div className="w-[92%] max-w-5xl mx-auto aspect-video relative rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                          <iframe
                            ref={previewIframeRef}
                            src={`/p/${proposal.slug}#preview`}
                            onLoad={() => {
                              sendPreviewMessage(proposal, selectedSlideId);
                              setTimeout(() => sendPreviewMessage(proposal, selectedSlideId), 300);
                            }}
                            className="absolute inset-0 border-0 pointer-events-none"
                            style={{
                              width: `${PREVIEW_SCALE_INVERSE * 100}%`,
                              height: `${PREVIEW_SCALE_INVERSE * 100}%`,
                              transform: `scale(${PREVIEW_SCALE})`,
                              transformOrigin: 'top left',
                            }}
                            title="Slide preview"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <Button
                            type="button"
                            onClick={handleGoToPrevSlide}
                            disabled={!hasPrevSlide}
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 text-[11px] text-gray-600"
                          >
                            <AppIcon icon="ui.sidebar-toggle" className="h-3 w-3" />
                            Previous
                          </Button>
                          <Button asChild variant="outline" size="sm" className="h-7 text-[11px] text-gray-700">
                            <Link to={`/p/${proposal.slug}#preview`}>
                              Open full preview
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            onClick={handleGoToNextSlide}
                            disabled={!hasNextSlide}
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 text-[11px] text-gray-600"
                          >
                            Next
                            <AppIcon icon="ui.chevron-right" className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="preview-empty"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <p className="text-xs text-gray-400">No preview available</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>}

            {/* Configurator — right panel */}
            <div className="flex-1 min-w-0 overflow-y-auto admin-scroll border-l border-gray-100">
              <div className="max-w-lg mx-auto px-3 py-3">
              {selectedSlide ? (
                <SlideConfigurator
                  slide={selectedSlide}
                  onChange={(updates) => updateSlide(selectedSlide.id, updates)}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center">
                  <div className="mb-3 flex justify-center text-gray-300">
                    <AppIcon icon="ui.home" size={28} />
                  </div>
                  <p className="text-sm text-gray-400">Select a slide to configure it</p>
                </div>
              )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>

    <MarkdownIngestorModal
      isOpen={ingestor.isOpen}
      mode={ingestor.mode}
      editorContent={ingestor.editorContent}
      onContentChange={ingestor.setEditorContent}
      onCursorChange={ingestor.setCursorPosition}
      onGenerate={handleMarkdownImport}
      onClose={ingestor.close}
    />

    {proposal && (
      <ProposalMarkdownEditorModal
        isOpen={markdownEditorOpen}
        proposal={proposal}
        onApply={handleMarkdownApply}
        onClose={() => setMarkdownEditorOpen(false)}
      />
    )}

    {proposal && (
      <PublishSuccessModal
        isOpen={showPublishSuccess}
        proposalUrl={`${window.location.origin}/p/${proposal.slug}`}
        shortCode={proposal.shortCode}
        partnerName={proposal.partnerName}
        proposalTitle={proposal.title}
        onClose={() => setShowPublishSuccess(false)}
      />
    )}

    <Dialog
      open={showPublishConfirm}
      onOpenChange={(open) => {
        if (publishing) return;
        setShowPublishConfirm(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-brand-serif">Publish proposal?</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-[#6b6b6b]">
            Choose how people can access this proposal once it is published.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-2">
            {([
              { value: 'public', label: 'Public', desc: 'Anyone with the link can view.' },
              { value: 'password', label: 'Private (password protected)', desc: 'Viewers must enter a password.' },
              { value: 'email_gated', label: 'Email gate', desc: 'Viewers submit their email to access.' },
            ] as const).map((opt) => (
              <label key={opt.value} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="publish-visibility"
                  value={opt.value}
                  checked={publishVisibility === opt.value}
                  onChange={() => setPublishVisibility(opt.value)}
                  className="mt-0.5 accent-gray-900"
                />
                <div>
                  <span className="text-sm text-gray-800">{opt.label}</span>
                  <p className="text-xs text-gray-400">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {publishVisibility === 'password' && (
            <div className="pl-6">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                {proposal.accessPassword ? 'Update password (optional)' : 'Set password'}
              </label>
              <Input
                type="password"
                value={publishPasswordInput}
                onChange={(e) => setPublishPasswordInput(e.target.value)}
                placeholder={proposal.accessPassword ? 'Leave blank to keep current password' : 'Enter password'}
                className="text-sm"
              />
              {proposal.accessPassword && (
                <p className="mt-1 text-xs text-gray-400">A password is already set for this proposal.</p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPublishConfirm(false)}
            disabled={publishing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirmPublish}
            disabled={publishing || (publishVisibility === 'password' && !proposal.accessPassword && !publishPasswordInput.trim())}
            className="inline-flex items-center gap-2"
          >
            {publishing ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={showUnpublishConfirm} onOpenChange={setShowUnpublishConfirm}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-brand-serif">Unpublish proposal?</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-[#6b6b6b]">
            If this proposal is unpublished, it will no longer be available to anyone who currently has access to it.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowUnpublishConfirm(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirmUnpublish}
          >
            Unpublish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

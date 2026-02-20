import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useProposalStore } from '../../store/proposalStore';
import type { Proposal, SlideConfig, SlideType } from '../../types/proposal';
import { SlideSortableList } from '../components/SlideSortableList';
import { SlideConfigurator } from '../components/SlideConfigurator';
import { createDefaultSlide } from '../../data/slideDefaults';
import { generateSlug, copyToClipboard } from '../../shared/utils/helpers';
import { useDialKit } from 'dialkit';
import { MarkdownIngestorModal } from '../../ingestor/MarkdownIngestorModal';
import { useIngestorState } from '../../ingestor/hooks/useIngestorState';
import { ThemePicker } from '../../themes/ThemePicker';
import { defaultThemeId, themes } from '../../themes/themeDefinitions';
import { AppIcon } from '../../shared/icons/AppIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

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
  const ingestor = useIngestorState();

  const editorValues = useDialKit('Editor', {
    autosave: {
      enabled: true,
      debounceMs: [500, 5000, 250, 1000] as [number, number, number, number],
    },
    preview: {
      showPanel: true,
    },
  });

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const p = proposals.find((p) => p.id === id);
    if (p) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProposal({ ...p });
      setHasUnsavedChanges(false);
      if (!selectedSlideId && p.slides.length > 0) {
        setSelectedSlideId(p.slides[0].id);
      }
    }
  }, [id, proposals]);

  useEffect(() => {
    if (proposals.length > 0) return;
    void fetchProposals();
  }, [fetchProposals, proposals.length]);

  const selectedSlide = proposal?.slides.find((s) => s.id === selectedSlideId) ?? null;
  const selectedSlideIndex = proposal?.slides.findIndex((s) => s.id === selectedSlideId) ?? -1;
  const hasPrevSlide = selectedSlideIndex > 0;
  const hasNextSlide = proposal ? selectedSlideIndex >= 0 && selectedSlideIndex < proposal.slides.length - 1 : false;

  const save = useCallback(
    async (updatedProposal: Proposal) => {
      setSaveState('saving');
      try {
        await updateProposal(updatedProposal.id, {
          title: updatedProposal.title,
          partnerName: updatedProposal.partnerName,
          slug: updatedProposal.slug,
          status: updatedProposal.status,
          slides: updatedProposal.slides,
          themeId: updatedProposal.themeId,
        });
        setSaveState('saved');
        setHasUnsavedChanges(false);
        setTimeout(() => setSaveState('idle'), 2000);
      } catch {
        setSaveState('error');
      }
    },
    [updateProposal]
  );

  useEffect(() => {
    if (!proposal || !editorValues.autosave.enabled || !hasUnsavedChanges) return;
    const timer = setTimeout(() => save(proposal), editorValues.autosave.debounceMs);
    return () => clearTimeout(timer);
  }, [proposal, save, editorValues.autosave.enabled, editorValues.autosave.debounceMs, hasUnsavedChanges]);

  const updateLocal = (updates: Partial<Proposal>) => {
    setProposal((prev) => prev ? { ...prev, ...updates } : prev);
    setHasUnsavedChanges(true);
  };

  const updateSlide = (id: string, updates: Partial<SlideConfig>) => {
    if (!proposal) return;
    const slides = proposal.slides.map((s) => s.id === id ? { ...s, ...updates } : s);
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
    const newStatus = proposal.status === 'published' ? 'draft' : 'published';
    updateLocal({ status: newStatus });
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

  const handleCopyLink = async () => {
    if (!proposal) return;
    await copyToClipboard(`${window.location.origin}/p/${proposal.slug}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const postPreviewUpdate = useCallback(() => {
    if (!proposal) return;
    const iframeWindow = previewIframeRef.current?.contentWindow;
    if (!iframeWindow) return;
    iframeWindow.postMessage(
      {
        type: 'handshake-editor-preview-update',
        proposal,
        selectedSlideId,
      },
      window.location.origin
    );
  }, [proposal, selectedSlideId]);

  useEffect(() => {
    postPreviewUpdate();
  }, [postPreviewUpdate]);

  useEffect(() => {
    const handlePreviewReady = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'handshake-editor-preview-ready') return;
      postPreviewUpdate();
    };

    window.addEventListener('message', handlePreviewReady);
    return () => window.removeEventListener('message', handlePreviewReady);
  }, [postPreviewUpdate]);

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
            className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
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
      <div className="flex items-center gap-4 px-6 py-3.5 border-b border-gray-100 bg-white flex-shrink-0">
        <Link to="/admin" className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5">
          <AppIcon icon="ui.sidebar-toggle" className="w-4 h-4" />
          Proposals
        </Link>

        <div className="flex-1 flex items-center gap-3">
          <Input
            className="h-8 border-0 bg-transparent px-2 py-1 text-sm font-semibold text-gray-900 shadow-none focus-visible:bg-gray-50 focus-visible:ring-0 min-w-0 flex-1 max-w-xs"
            value={proposal.title}
            onChange={(e) => updateLocal({ title: e.target.value })}
            placeholder="Proposal title..."
          />
          <Input
            className="h-8 w-auto border-0 bg-transparent px-2 py-1 text-sm text-gray-400 shadow-none focus-visible:bg-gray-50 focus-visible:ring-0"
            value={proposal.partnerName}
            onChange={(e) => updateLocal({ partnerName: e.target.value })}
            onBlur={(e) => updateLocal({ slug: generateSlug(e.target.value) })}
            placeholder="Partner name..."
          />
        </div>

        {/* Save state */}
        <div className="flex-shrink-0 flex items-center gap-1.5">
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

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={() => ingestor.open('import')}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            title="Import slides from Markdown"
          >
            <AppIcon icon="ui.file" className="w-3.5 h-3.5" />
            Import MD
          </Button>

          {proposal.status === 'published' && (
            <Button
              onClick={handleCopyLink}
              variant="secondary"
              size="sm"
              className="gap-1.5 text-xs"
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
            className={`h-8 px-4 text-xs font-semibold transition-all ${
              proposal.status === 'published'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {proposal.status === 'published' ? 'Published' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Main editor area */}
      <div className="flex-1 flex overflow-hidden">
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

        <div className="flex-1 min-w-0 grid grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)] overflow-hidden">
          {/* Preview panel */}
          {editorValues.preview.showPanel && <div className="relative overflow-hidden bg-admin">
            <div className="h-full w-full max-w-[72rem] mx-auto border-x border-gray-100 bg-admin flex flex-col">
              <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0 bg-white flex items-center gap-3">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Preview</span>
              </div>
              {selectedSlide && selectedSlide.enabled ? (
                <div className="flex-1 overflow-auto admin-scroll p-2.5 flex flex-col gap-2">
                  <div className="w-full aspect-video relative rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                    <iframe
                      ref={previewIframeRef}
                      src={`/p/${proposal.slug}#preview`}
                      onLoad={postPreviewUpdate}
                      className="absolute inset-0 w-full h-full border-0 pointer-events-none"
                      style={{ transform: 'scale(0.675)', transformOrigin: 'top left', width: '148.15%', height: '148.15%' }}
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
                      <a
                        href={`/p/${proposal.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open full preview
                      </a>
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
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs text-gray-400">No preview available</p>
                </div>
              )}
            </div>
          </div>}

          {/* Configurator — right panel */}
          <div className="flex-1 min-w-0 overflow-y-auto admin-scroll border-l border-gray-100">
            <div className="max-w-lg mx-auto px-3 py-3">
              <div className="mb-3">
                <ThemePicker
                  activeThemeId={proposal.themeId}
                  onChange={(themeId) => updateLocal({ themeId })}
                />
              </div>
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
    </div>
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
    </>
  );
}

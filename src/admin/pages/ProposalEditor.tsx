import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useProposalStore } from '../../store/proposalStore';
import type { Proposal, SlideConfig, SlideType } from '../../types/proposal';
import { SlideSortableList } from '../components/SlideSortableList';
import { SlideConfigurator } from '../components/SlideConfigurator';
import { createDefaultSlide } from '../../data/slideDefaults';
import { generateSlug, copyToClipboard } from '../../shared/utils/helpers';
import { useDialKit } from 'dialkit';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function ProposalEditor() {
  const { id } = useParams<{ id: string }>();
  const { proposals, updateProposal } = useProposalStore();

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
  const [copiedLink, setCopiedLink] = useState(false);

  // Load proposal from store
  useEffect(() => {
    const p = proposals.find((p) => p.id === id);
    if (p) {
      setProposal({ ...p });
      if (!selectedSlideId && p.slides.length > 0) {
        setSelectedSlideId(p.slides[0].id);
      }
    }
  }, [id, proposals]);

  const selectedSlide = proposal?.slides.find((s) => s.id === selectedSlideId) ?? null;

  // Debounced auto-save
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
          theme: updatedProposal.theme,
        });
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
      } catch {
        setSaveState('error');
      }
    },
    [updateProposal]
  );

  useEffect(() => {
    if (!proposal || !editorValues.autosave.enabled) return;
    const timer = setTimeout(() => save(proposal), editorValues.autosave.debounceMs);
    return () => clearTimeout(timer);
  }, [proposal, save, editorValues.autosave.enabled, editorValues.autosave.debounceMs]);

  const updateLocal = (updates: Partial<Proposal>) => {
    setProposal((prev) => prev ? { ...prev, ...updates } : prev);
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
    const newSlide = createDefaultSlide(type);
    const slides = [...proposal.slides, newSlide];
    updateLocal({ slides });
    setSelectedSlideId(newSlide.id);
  };

  const handlePublish = async () => {
    if (!proposal) return;
    const newStatus = proposal.status === 'published' ? 'draft' : 'published';
    updateLocal({ status: newStatus });
  };

  const handleCopyLink = async () => {
    if (!proposal) return;
    await copyToClipboard(`${window.location.origin}/p/${proposal.slug}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!proposal) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-3.5 border-b border-gray-100 bg-white flex-shrink-0">
        <Link to="/admin" className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Proposals
        </Link>

        <div className="flex-1 flex items-center gap-3">
          <input
            className="text-sm font-semibold text-gray-900 bg-transparent border-0 outline-none focus:bg-gray-50 px-2 py-1 rounded-lg transition-colors min-w-0 flex-1 max-w-xs"
            value={proposal.title}
            onChange={(e) => updateLocal({ title: e.target.value })}
            placeholder="Proposal title..."
          />
          <input
            className="text-sm text-gray-400 bg-transparent border-0 outline-none focus:bg-gray-50 px-2 py-1 rounded-lg transition-colors"
            value={proposal.partnerName}
            onChange={(e) => updateLocal({ partnerName: e.target.value, slug: generateSlug(e.target.value) })}
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
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={`/p/${proposal.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview
          </a>

          {proposal.status === 'published' && (
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {copiedLink ? (
                <><svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Copied!</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy link</>
              )}
            </button>
          )}

          <button
            onClick={handlePublish}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              proposal.status === 'published'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {proposal.status === 'published' ? '✓ Published' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Main editor area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide list — left panel */}
        <div className="w-52 flex-shrink-0 border-r border-gray-100 flex flex-col bg-gray-50/50">
          <div className="px-3 pt-3 pb-1">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-1">Slides</p>
          </div>
          <SlideSortableList
            slides={proposal.slides}
            selectedId={selectedSlideId}
            onSelect={setSelectedSlideId}
            onReorder={(slides) => updateLocal({ slides })}
            onToggle={handleToggleSlide}
            onDelete={handleDeleteSlide}
            onAdd={handleAddSlide}
          />
        </div>

        {/* Configurator — middle panel */}
        <div className="flex-1 overflow-y-auto admin-scroll">
          {selectedSlide ? (
            <div className="max-w-lg mx-auto px-6 py-6">
              <SlideConfigurator
                slide={selectedSlide}
                onChange={(updates) => updateSlide(selectedSlide.id, updates)}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-3xl mb-3 text-gray-300">◎</div>
                <p className="text-sm text-gray-400">Select a slide to configure it</p>
              </div>
            </div>
          )}
        </div>

        {/* Preview panel — right (togglable via dialkit) */}
        {editorValues.preview.showPanel && <div className="w-80 flex-shrink-0 border-l border-gray-100 bg-gray-900 relative overflow-hidden">
          <div className="absolute inset-0 flex flex-col">
            {/* Preview header */}
            <div className="px-4 py-3 border-b border-white/10 flex-shrink-0 flex items-center justify-between">
              <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Preview</span>
              <span className="text-xs text-white/20">{proposal.slides.filter(s => s.enabled).length} slides</span>
            </div>
            {/* Mini preview */}
            {selectedSlide && selectedSlide.enabled ? (
              <div className="flex-1 overflow-hidden relative">
                <iframe
                  key={selectedSlide.id}
                  src={`/p/${proposal.slug}#preview`}
                  className="absolute inset-0 w-full h-full border-0 pointer-events-none"
                  style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%' }}
                  title="Slide preview"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <a
                    href={`/p/${proposal.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg backdrop-blur-sm transition-colors border border-white/20"
                  >
                    Open full preview ↗
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-white/20">No preview available</p>
              </div>
            )}
          </div>
        </div>}
      </div>
    </div>
  );
}

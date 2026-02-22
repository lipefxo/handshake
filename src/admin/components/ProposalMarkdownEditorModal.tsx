import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMarkdownParser } from '../../ingestor/hooks/useMarkdownParser';
import { MarkdownEditor } from '../../ingestor/MarkdownEditor';
import { IngestorPreview } from '../../ingestor/IngestorPreview';
import { slidesToMarkdown } from '../../ingestor/parser/slidesToMarkdown';
import type { Proposal, SlideConfig } from '../../types/proposal';
import { AppIcon } from '../../shared/icons/AppIcon';

interface ProposalMarkdownEditorModalProps {
  isOpen: boolean;
  proposal: Proposal;
  onApply: (slides: SlideConfig[]) => void;
  onClose: () => void;
}

export function ProposalMarkdownEditorModal({
  isOpen,
  proposal,
  onApply,
  onClose,
}: ProposalMarkdownEditorModalProps) {
  const [editorContent, setEditorContent] = useState('');
  const [hasEdited, setHasEdited] = useState(false);

  // Keep refs up-to-date to avoid stale closures in effects
  const proposalRef = useRef(proposal);
  proposalRef.current = proposal;
  const onApplyRef = useRef(onApply);
  onApplyRef.current = onApply;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Initialize editor content when modal opens (never re-syncs after)
  useEffect(() => {
    if (!isOpen) {
      setHasEdited(false);
      return;
    }
    const p = proposalRef.current;
    setEditorContent(slidesToMarkdown({ ...p, companyName: p.brandOverrides?.companyName }));
  }, [isOpen]);

  const { result, isLoading, slideCount, warningCount, errorCount, hasBlockingErrors } =
    useMarkdownParser(editorContent, 800);

  // Auto-apply valid parse results after user edits
  useEffect(() => {
    if (!result || hasBlockingErrors || !hasEdited) return;
    if (result.slides.length === 0) return;
    onApplyRef.current(result.slides);
  }, [result, hasBlockingErrors, hasEdited]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleChange = useCallback((value: string) => {
    setEditorContent(value);
    setHasEdited(true);
  }, []);

  const isEmpty = !editorContent.trim();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-4 md:inset-6 lg:inset-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[67.5vw] lg:h-[67.5vh] z-50 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <button
                  onClick={onClose}
                  className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  <AppIcon icon="ui.close" className="w-4 h-4" />
                </button>

                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-gray-900">Edit as Markdown</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Changes apply automatically after a short pause.
                  </p>
                </div>

                {/* Status indicator */}
                <div className={`flex items-center gap-2 text-xs transition-opacity ${isLoading ? 'opacity-40' : 'opacity-100'}`}>
                  {!isEmpty && !isLoading && (
                    <>
                      <span className="text-gray-500">
                        {slideCount} slide{slideCount !== 1 ? 's' : ''}
                      </span>
                      {warningCount > 0 && (
                        <span className="text-amber-600">
                          · {warningCount} warning{warningCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      {errorCount > 0 && (
                        <span className="text-red-500">
                          · {errorCount} error{errorCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </>
                  )}
                  {isLoading && !isEmpty && (
                    <span className="w-3 h-3 border border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                  )}
                </div>

                <button
                  onClick={onClose}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all"
                >
                  Done
                </button>
              </div>
            </div>

            {/* Split pane */}
            <div className="flex-1 min-h-0 flex overflow-hidden">
              {/* Left: Editor (~60%) */}
              <div className="flex-1 min-w-0 flex flex-col border-r border-gray-100 overflow-hidden">
                <div className="flex-shrink-0 px-4 py-2 border-b border-gray-100 bg-gray-50/50">
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                    Markdown editor
                  </span>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <MarkdownEditor
                    value={editorContent}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Right: Preview (~40%) */}
              <div className="w-[22rem] flex-shrink-0 flex flex-col overflow-hidden bg-gray-50/30">
                <div className="flex-shrink-0 px-4 py-2 border-b border-gray-100 bg-gray-50/50">
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                    Live preview
                  </span>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <IngestorPreview
                    result={result}
                    isLoading={isLoading}
                    slideCount={slideCount}
                    warningCount={warningCount}
                    errorCount={errorCount}
                    isEmpty={isEmpty}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

import { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMarkdownParser } from './hooks/useMarkdownParser';
import { markdownToSlides } from './parser/markdownToSlides';
import { MarkdownEditor } from './MarkdownEditor';
import { IngestorPreview } from './IngestorPreview';
import { IngestorFormatGuide } from './IngestorFormatGuide';
import type { SlideConfig } from '../types/proposal';
import { AppIcon } from '../shared/icons/AppIcon';

interface MarkdownIngestorModalProps {
  isOpen: boolean;
  mode: 'new' | 'import';
  editorContent: string;
  onContentChange: (content: string) => void;
  onCursorChange: (pos: number) => void;
  onGenerate: (slides: SlideConfig[], frontmatter: { title?: string; partner?: string; date?: string; theme?: string }) => void;
  generationError?: string | null;
  onClose: () => void;
}

export function MarkdownIngestorModal({
  isOpen,
  mode,
  editorContent,
  onContentChange,
  onCursorChange,
  onGenerate,
  generationError,
  onClose,
}: MarkdownIngestorModalProps) {
  const { result, isLoading, slideCount, warningCount, errorCount, hasBlockingErrors } =
    useMarkdownParser(editorContent);

  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [isGenerating, setIsGenerating] = useState(false);
  const [inlineFeedback, setInlineFeedback] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, editorContent]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setInlineFeedback(null);
  }, [isOpen]);

  useEffect(() => {
    setInlineFeedback(null);
  }, [editorContent]);

  const handleClose = useCallback(() => {
    if (editorContent.trim()) {
      const confirmed = window.confirm('Close the editor? Your markdown content will be lost.');
      if (!confirmed) return;
    }
    onClose();
  }, [editorContent, onClose]);

  const handleGenerate = useCallback(async () => {
    setInlineFeedback(null);

    const parsed = markdownToSlides(editorContent);
    const parsedErrorCount =
      parsed.validation.filter((v) => v.status === 'error').length + parsed.errors.length;
    const hasParsedBlockingErrors = parsedErrorCount > 0;

    if (hasParsedBlockingErrors) {
      setInlineFeedback(parsed.errors[0] ?? 'Please resolve markdown errors before generating.');
      return;
    }

    if (parsed.slides.length === 0) {
      setInlineFeedback('No slides detected yet. Add content sections separated by ---.');
      return;
    }

    setIsGenerating(true);
    try {
      await onGenerate(parsed.slides, parsed.frontmatter);
    } catch (error) {
      setInlineFeedback(
        error instanceof Error ? error.message : 'Failed to generate proposal. Please try again.',
      );
    } finally {
      setIsGenerating(false);
    }
  }, [editorContent, onGenerate]);

  const isEmpty = !editorContent.trim();
  const disabledReason = isEmpty
    ? 'Add markdown content to enable generation.'
    : hasBlockingErrors
      ? 'Resolve markdown errors to continue.'
      : slideCount === 0
        ? 'No slides detected yet.'
        : null;
  const feedbackMessage = inlineFeedback ?? generationError ?? disabledReason;

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
                  onClick={handleClose}
                  className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  <AppIcon icon="ui.close" className="w-4 h-4" />
                </button>

                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-gray-900">
                    {mode === 'new' ? 'New proposal from Markdown' : 'Import slides from Markdown'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {mode === 'new'
                      ? 'Write or paste structured markdown to generate a complete proposal.'
                      : 'Write or paste markdown to add slides to the current proposal.'}
                  </p>
                </div>

                {/* Import mode selector (only in import mode) */}
                {mode === 'import' && (
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 flex-shrink-0">
                    {(['append', 'replace'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setImportMode(m)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          importMode === m
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {m === 'append' ? 'Append slides' : 'Replace slides'}
                      </button>
                    ))}
                  </div>
                )}

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  disabled={hasBlockingErrors || isEmpty || isGenerating || slideCount === 0}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {isGenerating ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <AppIcon icon="slide.features.speed" className="w-3.5 h-3.5" />
                  )}
                  {isGenerating
                    ? 'Generating…'
                    : mode === 'new'
                      ? 'Generate proposal'
                      : `Import ${slideCount > 0 ? slideCount + ' ' : ''}slide${slideCount !== 1 ? 's' : ''}`}
                </button>
              </div>
              {feedbackMessage && (
                <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2.5 py-1.5">
                  {feedbackMessage}
                </p>
              )}
            </div>

            {/* Split pane */}
            <div className="flex-1 min-h-0 flex overflow-hidden">
              {/* Left: Editor */}
              <div className="flex-1 min-w-0 flex flex-col border-r border-gray-100 overflow-hidden">
                {/* Format guide */}
                <IngestorFormatGuide />

                {/* Editor label */}
                <div className="flex-shrink-0 px-4 py-2 border-b border-gray-100 bg-gray-50/50">
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                    Markdown editor
                  </span>
                </div>

                {/* Editor */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <MarkdownEditor
                    value={editorContent}
                    onChange={onContentChange}
                    onCursorChange={onCursorChange}
                  />
                </div>
              </div>

              {/* Right: Preview */}
              <div className="w-[22rem] flex-shrink-0 flex flex-col overflow-hidden bg-gray-50/30">
                {/* Preview label */}
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

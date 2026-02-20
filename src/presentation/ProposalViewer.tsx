import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import type { Proposal } from '../types/proposal';
import { useProposalStore } from '../store/proposalStore';
import { SlideRenderer } from './components/SlideRenderer';
import { SlideNavigation } from './components/SlideNavigation';
import { ProgressBar } from '../shared/components/ProgressBar';
import { useSlideNavigation } from './hooks/useSlideNavigation';
import { useDialKit } from 'dialkit';
import { getTransitionVariants } from '../shared/utils/animations';
import { ThemeProvider } from '../themes/ThemeProvider';
import { defaultThemeId } from '../themes/themeDefinitions';

export function ProposalViewer() {
  const { slug } = useParams<{ slug: string }>();
  const { getProposalBySlug } = useProposalStore();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewSelectedSlideId, setPreviewSelectedSlideId] = useState<string | null>(null);

  const settings = useDialKit('Presentation', {
    appearance: {
      showNavDots: true,
      showProgress: true,
      grainOpacity: [0, 0.1, 0.005, 0.03] as [number, number, number, number],
    },
    animation: {
      staggerDelay: [0.05, 0.4, 0.01, 0.12] as [number, number, number, number],
      entryDuration: [0.3, 1.5, 0.05, 0.8] as [number, number, number, number],
    },
    counter: {
      durationMs: [500, 3000, 100, 1800] as [number, number, number, number],
    },
  });

  useEffect(() => {
    if (!slug) return;
    getProposalBySlug(slug).then((p) => {
      setProposal(p);
      setLoading(false);
      if (!p) setError('This proposal does not exist or has not been published.');
    });
  }, [slug, getProposalBySlug]);

  useEffect(() => {
    const isPreviewMode = window.location.hash.includes('preview');
    if (!isPreviewMode) return;

    const handleEditorPreviewUpdate = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'handshake-editor-preview-update') return;
      if (event.data?.proposal) {
        setProposal(event.data.proposal as Proposal);
        setLoading(false);
        setError('');
      }
      setPreviewSelectedSlideId(event.data?.selectedSlideId ?? null);
    };

    window.addEventListener('message', handleEditorPreviewUpdate);
    window.parent?.postMessage({ type: 'handshake-editor-preview-ready' }, window.location.origin);
    return () => window.removeEventListener('message', handleEditorPreviewUpdate);
  }, []);

  const enabledSlides = proposal?.slides.filter((s) => s.enabled) ?? [];
  const { current, goTo, containerRef } = useSlideNavigation(enabledSlides.length);

  useEffect(() => {
    if (!previewSelectedSlideId || enabledSlides.length === 0) return;
    const selectedIndex = enabledSlides.findIndex((slide) => slide.id === previewSelectedSlideId);
    if (selectedIndex >= 0) {
      requestAnimationFrame(() => goTo(selectedIndex));
    }
  }, [previewSelectedSlideId, enabledSlides, goTo]);

  return (
    <ThemeProvider themeId={proposal?.themeId ?? defaultThemeId} className="contents">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
          <div className="w-8 h-8 border rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-accent)' }} />
        </div>
      ) : error || !proposal ? (
        <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center"
          style={{ background: 'var(--color-bg-primary)' }}>
          <p className="text-6xl mb-6 opacity-20">◎</p>
          <h1
            className="text-2xl mb-3"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
          >
            Proposal not found
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}>
            {error || 'This link may have expired or been removed.'}
          </p>
        </div>
      ) : enabledSlides.length === 0 ? (
        <div className="flex items-center justify-center min-h-screen"
          style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-secondary)' }}>
          <p style={{ fontFamily: 'var(--font-body)' }}>No slides to display.</p>
        </div>
      ) : (
        <>
          {settings.appearance.showProgress && (
            <ProgressBar current={current} total={enabledSlides.length} />
          )}
          {settings.appearance.showNavDots && (
            <SlideNavigation current={current} total={enabledSlides.length} onNavigate={goTo} />
          )}

          <div ref={containerRef} className="slide-container">
            {enabledSlides.map((slide, index) => (
              <motion.section
                key={`${slide.id}-${slide.transition ?? 'slide-up'}`}
                className="slide-section"
                style={{ background: slide.backgroundOverride || undefined }}
                variants={getTransitionVariants(slide.transition)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.6 }}
              >
                <SlideRenderer slide={slide} index={index} />
              </motion.section>
            ))}
          </div>
        </>
      )}
    </ThemeProvider>
  );
}

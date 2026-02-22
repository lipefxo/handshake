import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import type { Proposal, SlideConfig } from '../types/proposal';
import { useProposalStore } from '../store/proposalStore';
import { SlideRenderer } from './components/SlideRenderer';
import { SlideNavigation } from './components/SlideNavigation';
import { ProgressBar } from '../shared/components/ProgressBar';
import { useSlideNavigation } from './hooks/useSlideNavigation';
import { getTransitionVariants } from '../shared/utils/animations';
import { ThemeProvider } from '../themes/ThemeProvider';
import { defaultThemeId } from '../themes/themeDefinitions';
import { ErrorBoundary } from '../shared/components/ErrorBoundary';
import { PasswordGate } from './components/PasswordGate';
import { EmailGate } from './components/EmailGate';
import { ExpiredPage } from './components/ExpiredPage';

function getContentFingerprint(slide: SlideConfig): string {
  const c = slide.content as Record<string, unknown>;
  const parts: number[] = [];
  for (const val of Object.values(c)) {
    if (Array.isArray(val)) parts.push(val.length);
  }
  return parts.length > 0 ? parts.join('-') : '';
}

function ProposalViewerContent() {
  const { slug } = useParams<{ slug: string }>();
  const { getProposalBySlug, getOwnProposalBySlug } = useProposalStore();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewSelectedSlideId, setPreviewSelectedSlideId] = useState<string | null>(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const isPreviewMode = useMemo(() => window.location.hash.includes('preview'), []);

  const settings = {
    appearance: {
      showNavDots: true,
      showProgress: true,
      grainOpacity: 0.005,
    },
    animation: {
      staggerDelay: 0.12,
      entryDuration: 0.8,
    },
    counter: {
      durationMs: 1800,
    },
  };

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;
    const isPreviewMode = window.location.hash.includes('preview');

    const loadProposal = async () => {
      setLoading(true);
      setError('');

      const publishedProposal = await getProposalBySlug(slug);
      if (cancelled) return;

      if (publishedProposal) {
        setProposal(publishedProposal);
        setAccessGranted((publishedProposal.visibility ?? 'public') === 'public');
        setLoading(false);
        return;
      }

      if (isPreviewMode) {
        const ownProposal = await getOwnProposalBySlug(slug);
        if (cancelled) return;
        if (ownProposal) {
          setProposal(ownProposal);
          setAccessGranted(true);
          setLoading(false);
          return;
        }
      }

      setProposal(null);
      setLoading(false);
      setError('This proposal was not found.');
    };

    void loadProposal();
    return () => {
      cancelled = true;
    };
  }, [slug, getProposalBySlug, getOwnProposalBySlug]);

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
    const readyMessage = { type: 'handshake-editor-preview-ready' };
    window.parent?.postMessage(readyMessage, window.location.origin);
    window.opener?.postMessage(readyMessage, window.location.origin);
    return () => window.removeEventListener('message', handleEditorPreviewUpdate);
  }, []);

  const enabledSlides = proposal?.slides.filter((s) => s.enabled) ?? [];
  const { current, goTo, next, containerRef } = useSlideNavigation(enabledSlides.length);

  useEffect(() => {
    if (!previewSelectedSlideId || enabledSlides.length === 0) return;
    const selectedIndex = enabledSlides.findIndex((slide) => slide.id === previewSelectedSlideId);
    if (selectedIndex >= 0) {
      requestAnimationFrame(() => goTo(selectedIndex));
    }
  }, [previewSelectedSlideId, enabledSlides, goTo]);

  const handleContainerClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const interactiveElement = target.closest(
      'a, button, input, textarea, select, label, [role="button"], [data-no-slide-advance]'
    );

    if (interactiveElement) return;
    next();
  };

  // Check expiration
  const isExpired = proposal?.expiresAt ? new Date(proposal.expiresAt) < new Date() : false;

  return (
    <ThemeProvider themeId={proposal?.themeId ?? defaultThemeId} brandOverrides={proposal?.brandOverrides} className="contents">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
          <div className="w-8 h-8 border rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-accent)' }} />
        </div>
      ) : isExpired ? (
        <ExpiredPage />
      ) : proposal && proposal.visibility === 'password' && !accessGranted ? (
        <PasswordGate proposal={proposal} onGranted={() => setAccessGranted(true)} />
      ) : proposal && proposal.visibility === 'email_gated' && !accessGranted ? (
        <EmailGate proposal={proposal} onGranted={() => setAccessGranted(true)} />
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

          <div
            ref={containerRef}
            className="slide-container"
            style={{ backgroundColor: 'var(--color-bg-primary)' }}
            onClick={handleContainerClick}
          >
            {enabledSlides.map((slide, index) => {
              const fp = isPreviewMode ? getContentFingerprint(slide) : '';
              const slideKey = fp
                ? `${slide.id}-${slide.transition ?? 'slide-up'}-${fp}`
                : `${slide.id}-${slide.transition ?? 'slide-up'}`;
              return (
                <motion.section
                  key={slideKey}
                  className="slide-section"
                  style={{ backgroundColor: slide.backgroundOverride || 'var(--color-bg-primary)' }}
                  variants={getTransitionVariants(slide.transition)}
                  initial={false}
                  whileInView="visible"
                  viewport={{ once: false, amount: 0.6 }}
                >
                  <SlideRenderer slide={slide} index={index} />
                </motion.section>
              );
            })}
          </div>
        </>
      )}
    </ThemeProvider>
  );
}

export function ProposalViewer() {
  return (
    <ErrorBoundary>
      <ProposalViewerContent />
    </ErrorBoundary>
  );
}

import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import type { Proposal, ProposalAccessMeta, SlideConfig } from '../types/proposal';
import { useProposalStore } from '../store/proposalStore';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
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
import { DEMO_PROPOSAL, DEMO_PROPOSAL_SLUG } from '../data/demoProposal';
import type { WorkspaceBrandTheme } from '../types/workspace';

function getContentFingerprint(slide: SlideConfig): string {
  const c = slide.content as unknown as Record<string, unknown>;
  const parts: number[] = [];
  for (const val of Object.values(c)) {
    if (Array.isArray(val)) parts.push(val.length);
  }
  return parts.length > 0 ? parts.join('-') : '';
}

function getGateStorageKey(proposalId: string): string {
  return `handshake:proposal-access:${proposalId}`;
}

function getProposalBrandThemeCacheKey(slug: string): string {
  return `handshake:proposal-brand-theme:${slug}`;
}

function readCachedProposalBrandTheme(slug: string): WorkspaceBrandTheme | null {
  try {
    const raw = window.localStorage.getItem(getProposalBrandThemeCacheKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkspaceBrandTheme;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedProposalBrandTheme(slug: string, brandTheme: WorkspaceBrandTheme | undefined): void {
  if (!brandTheme) return;
  try {
    window.localStorage.setItem(
      getProposalBrandThemeCacheKey(slug),
      JSON.stringify(brandTheme),
    );
  } catch {
    // no-op
  }
}

function getStoredAccessToken(proposalId: string): string | null {
  try {
    return window.localStorage.getItem(getGateStorageKey(proposalId));
  } catch {
    return null;
  }
}

function storeAccessToken(proposalId: string, token: string): void {
  try {
    window.localStorage.setItem(getGateStorageKey(proposalId), token);
  } catch {
    // no-op
  }
}

function clearAccessToken(proposalId: string): void {
  try {
    window.localStorage.removeItem(getGateStorageKey(proposalId));
  } catch {
    // no-op
  }
}

function ProposalViewerContent() {
  const { slug } = useParams<{ slug: string }>();
  const {
    getProposalMetaBySlug,
    getProposalContentBySlug,
    getOwnProposalBySlug,
  } = useProposalStore();
  const user = useAuthStore((state) => state.user);
  const currentWorkspaceId = useWorkspaceStore((state) => state.currentWorkspace?.id);
  const currentWorkspaceBrandTheme = useWorkspaceStore((state) => state.currentWorkspace?.brandTheme);
  const cachedWorkspaceBrandTheme = useWorkspaceStore((state) => state.cachedBrandTheme);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [proposalMeta, setProposalMeta] = useState<ProposalAccessMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewSelectedSlideId, setPreviewSelectedSlideId] = useState<string | null>(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const hasLivePreviewUpdateRef = useRef(false);
  const isPreviewMode = window.location.hash.includes('preview');
  const isEmbeddedEditorPreview = isPreviewMode && window.self !== window.top;
  const cachedProposalBrandTheme = useMemo(
    () => (slug ? (readCachedProposalBrandTheme(slug) ?? undefined) : undefined),
    [slug],
  );

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
    if (!slug || !proposal?.workspaceBrandTheme) return;
    writeCachedProposalBrandTheme(slug, proposal.workspaceBrandTheme);
  }, [slug, proposal?.workspaceBrandTheme]);

  useEffect(() => {
    if (!slug) return;

    // Embedded editor previews receive all data via postMessage — skip the
    // network fetch entirely to avoid race conditions where the async load
    // resets state that was already hydrated from the editor's postMessage.
    if (isEmbeddedEditorPreview) return;

    let cancelled = false;
    const isPreviewMode = window.location.hash.includes('preview');

    const loadProposal = async () => {
      setLoading(true);
      setError('');
      setProposalMeta(null);
      setProposal(null);
      setAccessGranted(false);

      if (slug === DEMO_PROPOSAL_SLUG) {
        setProposalMeta({
          id: DEMO_PROPOSAL.id,
          slug: DEMO_PROPOSAL.slug,
          shortCode: DEMO_PROPOSAL.shortCode,
          title: DEMO_PROPOSAL.title,
          partnerName: DEMO_PROPOSAL.partnerName,
          status: DEMO_PROPOSAL.status,
          visibility: DEMO_PROPOSAL.visibility,
          expiresAt: DEMO_PROPOSAL.expiresAt,
          themeId: DEMO_PROPOSAL.themeId,
        });
        setProposal(DEMO_PROPOSAL);
        setAccessGranted(true);
        setLoading(false);
        return;
      }

      const meta = await getProposalMetaBySlug(slug);
      if (cancelled) return;

      if (meta) {
        setProposalMeta(meta);
        const initialContent = await getProposalContentBySlug(slug);
        if (cancelled) return;

        if (initialContent) {
          if (isPreviewMode && hasLivePreviewUpdateRef.current) {
            setLoading(false);
            return;
          }
          setProposal(initialContent);
          setAccessGranted(true);
          setLoading(false);
          return;
        }

        if (meta.visibility === 'password' || meta.visibility === 'email_gated') {
          const storedToken = getStoredAccessToken(meta.id);
          if (storedToken) {
            const gatedContent = await getProposalContentBySlug(slug, storedToken);
            if (cancelled) return;
            if (gatedContent) {
              setProposal(gatedContent);
              setAccessGranted(true);
              setLoading(false);
              return;
            }
            clearAccessToken(meta.id);
          }
        }
      }

      if (isPreviewMode) {
        const ownProposal = await getOwnProposalBySlug(slug);
        if (cancelled) return;
        if (ownProposal) {
          if (hasLivePreviewUpdateRef.current) {
            setLoading(false);
            return;
          }
          setProposalMeta({
            id: ownProposal.id,
            slug: ownProposal.slug,
            shortCode: ownProposal.shortCode,
            title: ownProposal.title,
            partnerName: ownProposal.partnerName,
            status: ownProposal.status,
            visibility: ownProposal.visibility,
            expiresAt: ownProposal.expiresAt,
            themeId: ownProposal.themeId,
          });
          setProposal(ownProposal);
          setAccessGranted(true);
          setLoading(false);
          return;
        }
      }

      setProposal(null);
      if (meta) {
        setAccessGranted(false);
        setLoading(false);
        return;
      }
      setLoading(false);
      setError('This proposal was not found.');
    };

    void loadProposal();
    return () => {
      cancelled = true;
    };
  }, [slug, getProposalContentBySlug, getProposalMetaBySlug, getOwnProposalBySlug, isEmbeddedEditorPreview]);

  useEffect(() => {
    const isPreviewMode = window.location.hash.includes('preview');
    if (!isPreviewMode) return;

    const handleEditorPreviewUpdate = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'handshake-editor-preview-update') return;
      if (event.data?.proposal) {
        hasLivePreviewUpdateRef.current = true;
        setProposal(event.data.proposal as Proposal);
        setLoading(false);
        setError('');
        setAccessGranted(true);
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
  const embeddedPreviewSlides =
    isEmbeddedEditorPreview
      ? (previewSelectedSlideId
          ? enabledSlides.filter((slide) => slide.id === previewSelectedSlideId)
          : enabledSlides.slice(0, 1))
      : enabledSlides;

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
  const effectiveExpiration = proposal?.expiresAt ?? proposalMeta?.expiresAt;
  const isExpired = effectiveExpiration ? new Date(effectiveExpiration) < new Date() : false;
  const canReturnToEditor = Boolean(
    user &&
    proposal?.id &&
    proposal.workspace_id === currentWorkspaceId
  );
  const backToEditorPath = canReturnToEditor && proposal?.id ? `/admin/proposals/${proposal.id}` : undefined;

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.style.backgroundColor = 'var(--color-bg-primary)';
    body.style.backgroundColor = 'var(--color-bg-primary)';
    return () => {
      html.style.backgroundColor = '';
      body.style.backgroundColor = '';
    };
  }, []);

  return (
    <ThemeProvider
      themeId={proposal?.themeId ?? defaultThemeId}
      brandOverrides={proposal?.brandOverrides}
      workspaceBrandTheme={
        proposal?.workspaceBrandTheme
        ?? currentWorkspaceBrandTheme
        ?? cachedProposalBrandTheme
        ?? cachedWorkspaceBrandTheme
      }
      className="contents"
    >
      {loading ? (
        <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
          <div className="w-8 h-8 border rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-accent)' }} />
        </div>
      ) : isExpired ? (
        <ExpiredPage />
      ) : proposalMeta && proposalMeta.visibility === 'password' && !accessGranted ? (
        <PasswordGate
          proposalId={proposalMeta.id}
          proposalTitle={proposalMeta.title}
          onGranted={async (grant) => {
            if (!slug) return;
            storeAccessToken(proposalMeta.id, grant.token);
            const content = await getProposalContentBySlug(slug, grant.token);
            if (content) {
              setProposal(content);
              setAccessGranted(true);
              setError('');
              return;
            }
            clearAccessToken(proposalMeta.id);
            setError('Unable to unlock this proposal. Please try again.');
          }}
        />
      ) : proposalMeta && proposalMeta.visibility === 'email_gated' && !accessGranted ? (
        <EmailGate
          proposalId={proposalMeta.id}
          proposalTitle={proposalMeta.title}
          onGranted={async (grant) => {
            if (!slug) return;
            storeAccessToken(proposalMeta.id, grant.token);
            const content = await getProposalContentBySlug(slug, grant.token);
            if (content) {
              setProposal(content);
              setAccessGranted(true);
              setError('');
              return;
            }
            clearAccessToken(proposalMeta.id);
            setError('Unable to unlock this proposal. Please try again.');
          }}
        />
      ) : isEmbeddedEditorPreview && !proposal ? (
        <div className="flex items-center justify-center min-h-screen"
          style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-secondary)' }}>
          <p style={{ fontFamily: 'var(--font-body)' }}>Loading preview…</p>
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
          {!isEmbeddedEditorPreview && settings.appearance.showNavDots && (
            <SlideNavigation
              current={current}
              total={enabledSlides.length}
              onNavigate={goTo}
              backToEditorPath={backToEditorPath}
            />
          )}

          <div
            ref={containerRef}
            className="slide-container"
            style={{ backgroundColor: 'var(--color-bg-primary)' }}
            onClick={handleContainerClick}
          >
            {embeddedPreviewSlides.map((slide, index) => {
              const fp = isPreviewMode ? getContentFingerprint(slide) : '';
              const slideKey = fp
                ? `${slide.id}-${slide.transition ?? 'slide-up'}-${fp}`
                : `${slide.id}-${slide.transition ?? 'slide-up'}`;
              const originalIndex = enabledSlides.findIndex((enabledSlide) => enabledSlide.id === slide.id);
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
                  <SlideRenderer
                    slide={slide}
                    index={originalIndex >= 0 ? originalIndex : index}
                    totalSlides={enabledSlides.length}
                    proposalPartnerName={proposal.partnerName}
                    proposalCompanyLogo={proposal.brandOverrides?.companyLogo}
                    proposalCompanyName={proposal.brandOverrides?.companyName}
                    footerBrandingEnabled={proposal.brandOverrides?.showFooterBranding !== false}
                  />
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

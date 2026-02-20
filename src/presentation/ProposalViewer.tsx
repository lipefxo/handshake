import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import type { Proposal } from '../types/proposal';
import { useProposalStore } from '../store/proposalStore';
import { SlideRenderer } from './components/SlideRenderer';
import { SlideNavigation } from './components/SlideNavigation';
import { ProgressBar } from '../shared/components/ProgressBar';
import { useSlideNavigation } from './hooks/useSlideNavigation';

export function ProposalViewer() {
  const { slug } = useParams<{ slug: string }>();
  const { getProposalBySlug } = useProposalStore();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    getProposalBySlug(slug).then((p) => {
      setProposal(p);
      setLoading(false);
      if (!p) setError('This proposal does not exist or has not been published.');
    });
  }, [slug, getProposalBySlug]);

  const enabledSlides = proposal?.slides.filter((s) => s.enabled) ?? [];
  const { current, goTo, containerRef } = useSlideNavigation(enabledSlides.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="w-8 h-8 border border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
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
    );
  }

  if (enabledSlides.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen"
        style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-secondary)' }}>
        <p style={{ fontFamily: 'var(--font-body)' }}>No slides to display.</p>
      </div>
    );
  }

  return (
    <>
      <ProgressBar current={current} total={enabledSlides.length} />
      <SlideNavigation current={current} total={enabledSlides.length} onNavigate={goTo} />

      <div ref={containerRef} className="slide-container">
        {enabledSlides.map((slide, index) => (
          <motion.section
            key={slide.id}
            className="slide-section"
            style={{ background: slide.backgroundOverride || undefined }}
          >
            <SlideRenderer slide={slide} index={index} />
          </motion.section>
        ))}
      </div>
    </>
  );
}

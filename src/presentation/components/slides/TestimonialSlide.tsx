import { motion } from 'motion/react';
import type { TestimonialSlideContent } from '../../../types/proposal';
import { GradientOrb } from '../../../shared/components/GradientOrb';
import { staggerContainer, fadeUpChild, staticContainer, staticChild } from '../../../shared/utils/animations';
import { useExportMode } from '../../../shared/contexts/ExportModeContext';
import { OptimizedImage } from '../OptimizedImage';

interface TestimonialSlideProps {
  content: TestimonialSlideContent;
}

export function TestimonialSlide({ content }: TestimonialSlideProps) {
  const isExport = useExportMode();
  return (
    <div
      className="relative w-full h-full flex items-center justify-center px-6 md:px-8 overflow-hidden"
      style={{ background: 'var(--color-bg-secondary)' }}
    >
      <GradientOrb size={700} className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="grain-overlay" />

      <motion.div
        className="relative z-10 max-w-3xl mx-auto text-center"
        variants={isExport ? staticContainer : staggerContainer}
        initial={isExport ? 'visible' : 'hidden'}
        animate={isExport ? 'visible' : undefined}
        whileInView={isExport ? undefined : 'visible'}
        viewport={isExport ? undefined : { once: true, amount: 0.4 }}
      >
        {/* Large quote mark */}
        <motion.div
          variants={isExport ? staticChild : fadeUpChild}
          className="text-6xl md:text-8xl leading-none mb-4 md:mb-6"
          style={{ color: 'var(--color-border)', fontFamily: 'var(--font-display)' }}
        >
          ❝
        </motion.div>

        <motion.blockquote
          variants={isExport ? staticChild : fadeUpChild}
          className="text-xl md:text-3xl leading-relaxed mb-6 md:mb-10 italic"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        >
          {content.quote}
        </motion.blockquote>

        <motion.div variants={isExport ? staticChild : fadeUpChild} className="flex items-center justify-center gap-4">
          {content.avatar ? (
            <OptimizedImage
              src={content.avatar}
              alt={content.author}
              className="w-12 h-12 rounded-full object-cover"
              style={{ border: '1px solid var(--color-border)' }}
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{ background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}
            >
              {content.author.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="text-left">
            <div
              className="text-sm font-semibold"
              style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}
            >
              {content.author}
            </div>
            {(content.role || content.company) && (
              <div
                className="text-xs mt-0.5"
                style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
              >
                {[content.role, content.company].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

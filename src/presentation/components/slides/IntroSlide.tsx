import { motion } from 'motion/react';
import type { IntroSlideContent } from '../../../types/proposal';
import { GradientOrb } from '../../../shared/components/GradientOrb';
import { staggerContainer, fadeUpChild, staticContainer, staticChild } from '../../../shared/utils/animations';
import { useExportMode } from '../../../shared/contexts/ExportModeContext';
import { OptimizedImage } from '../OptimizedImage';

interface IntroSlideProps {
  content: IntroSlideContent;
}

export function IntroSlide({ content }: IntroSlideProps) {
  const isExport = useExportMode();
  const hasImage = !!content.image;
  const imageRight = content.imagePosition === 'right' || !content.imagePosition;
  const bodyParagraphs = (content.body || '')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  return (
    <div
      className="relative w-full h-full flex items-center overflow-hidden"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      <GradientOrb size={500} className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="grain-overlay" />

      <div className={`relative z-10 w-full max-w-6xl mx-auto px-6 md:px-8 flex flex-col md:flex-row items-center gap-6 md:gap-16 ${hasImage && !imageRight ? 'md:flex-row-reverse' : ''}`}>
        <motion.div
          className="flex-1"
          variants={isExport ? staticContainer : staggerContainer}
          initial={isExport ? 'visible' : 'hidden'}
          animate={isExport ? 'visible' : undefined}
          whileInView={isExport ? undefined : 'visible'}
          viewport={isExport ? undefined : { once: true, amount: 0.3 }}
        >
          <motion.p
            variants={isExport ? staticChild : fadeUpChild}
            className="text-xs tracking-widest uppercase mb-2 md:mb-4"
            style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
          >
            {content.label || 'Introduction'}
          </motion.p>
          <motion.h2
            variants={isExport ? staticChild : fadeUpChild}
            className="text-2xl md:text-6xl mb-3 md:mb-8 leading-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
          >
            {content.heading}
          </motion.h2>
          <motion.div
            variants={isExport ? staticChild : fadeUpChild}
            className="text-sm md:text-lg leading-relaxed space-y-3 md:space-y-4"
            style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', maxWidth: '52ch' }}
          >
            {(bodyParagraphs.length > 0 ? bodyParagraphs : [content.body || '']).map((paragraph, index) => (
              <p key={index} className="whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </motion.div>
        </motion.div>

        {hasImage && (
          <motion.div
            className="w-full max-w-[180px] md:flex-1 md:aspect-square md:max-w-md"
            initial={isExport ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            animate={isExport ? { opacity: 1, scale: 1 } : undefined}
            whileInView={isExport ? undefined : { opacity: 1, scale: 1 }}
            viewport={isExport ? undefined : { once: true, amount: 0.3 }}
            transition={isExport ? undefined : { duration: 0.8, delay: 0.3 }}
          >
            <OptimizedImage
              src={content.image}
              alt={content.heading}
              className="w-full h-full object-cover rounded-2xl"
              style={{ border: '1px solid var(--color-border)' }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}

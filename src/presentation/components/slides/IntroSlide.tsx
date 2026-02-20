import { motion } from 'motion/react';
import type { IntroSlideContent } from '../../../types/proposal';
import { GradientOrb } from '../../../shared/components/GradientOrb';
import { staggerContainer, fadeUpChild } from '../../../shared/utils/animations';

interface IntroSlideProps {
  content: IntroSlideContent;
}

export function IntroSlide({ content }: IntroSlideProps) {
  const hasImage = !!content.image;
  const imageRight = content.imagePosition === 'right' || !content.imagePosition;

  return (
    <div
      className="relative w-full h-full flex items-center overflow-hidden"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      <GradientOrb size={500} color="rgba(255,255,255,0.04)" className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="grain-overlay" />

      <div className={`relative z-10 w-full max-w-6xl mx-auto px-8 flex items-center gap-16 ${hasImage && !imageRight ? 'flex-row-reverse' : ''}`}>
        <motion.div
          className="flex-1"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.p
            variants={fadeUpChild}
            className="text-xs tracking-widest uppercase mb-4"
            style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
          >
            Introduction
          </motion.p>
          <motion.h2
            variants={fadeUpChild}
            className="text-4xl md:text-6xl mb-8 leading-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
          >
            {content.heading}
          </motion.h2>
          <motion.p
            variants={fadeUpChild}
            className="text-lg leading-relaxed"
            style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', maxWidth: '52ch' }}
          >
            {content.body}
          </motion.p>
        </motion.div>

        {hasImage && (
          <motion.div
            className="flex-1 aspect-square max-w-md"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <img
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

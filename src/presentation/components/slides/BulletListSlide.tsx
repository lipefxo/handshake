import { motion } from 'motion/react';
import type { BulletListSlideContent } from '../../../types/proposal';
import { GradientOrb } from '../../../shared/components/GradientOrb';
import { fadeUpChild, staggerContainer } from '../../../shared/utils/animations';

interface BulletListSlideProps {
  content: BulletListSlideContent;
}

export function BulletListSlide({ content }: BulletListSlideProps) {
  const items = content.items.filter((item) => item.trim().length > 0);

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center px-6 md:px-8 py-8 md:py-14 overflow-hidden"
      style={{ background: 'var(--color-bg-secondary)' }}
    >
      <GradientOrb size={520} className="top-0 right-0 translate-x-1/3 -translate-y-1/3" />
      <div className="grain-overlay" />

      <motion.div
        className="relative z-10 w-full max-w-5xl mx-auto"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        <motion.p
          variants={fadeUpChild}
          className="text-xs tracking-widest uppercase mb-2 md:mb-3"
          style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
        >
          {content.label || 'Key points'}
        </motion.p>
        <motion.h2
          variants={fadeUpChild}
          className="text-2xl md:text-5xl leading-tight"
          style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
        >
          {content.heading}
        </motion.h2>
        {content.subheading && (
          <motion.p
            variants={fadeUpChild}
            className="mt-3 text-sm md:text-lg"
            style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}
          >
            {content.subheading}
          </motion.p>
        )}

        <motion.ul className="mt-6 md:mt-10 space-y-3 md:space-y-4" variants={staggerContainer}>
          {items.map((item, index) => (
            <motion.li
              key={`${item}-${index}`}
              variants={fadeUpChild}
              className="flex items-start gap-3 rounded-xl border px-4 py-3 md:px-5 md:py-4"
              style={{
                borderColor: 'var(--color-border)',
                background: 'color-mix(in srgb, var(--color-bg-primary) 60%, transparent)',
              }}
            >
              <span
                className="mt-1 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ background: 'var(--color-accent)' }}
              />
              <p
                className="text-sm md:text-lg leading-relaxed"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}
              >
                {item}
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>
    </div>
  );
}

import { motion } from 'framer-motion';
import type { ComparisonSlideContent } from '../../../types/proposal';
import { GradientOrb } from '../../../shared/components/GradientOrb';
import { staggerContainer, fadeUpChild } from '../../../shared/utils/animations';

interface ComparisonSlideProps {
  content: ComparisonSlideContent;
}

export function ComparisonSlide({ content }: ComparisonSlideProps) {
  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center px-8 py-16 overflow-hidden"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      <GradientOrb size={600} color="rgba(255,255,255,0.03)" className="top-0 left-0 -translate-x-1/4 -translate-y-1/4" />
      <div className="grain-overlay" />

      <motion.div
        className="relative z-10 w-full max-w-4xl mx-auto"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.h2
          variants={fadeUpChild}
          className="text-4xl md:text-5xl text-center mb-14"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        >
          {content.heading}
        </motion.h2>

        <motion.div variants={fadeUpChild} className="grid grid-cols-2 gap-px" style={{ background: 'var(--color-border)' }}>
          {/* Before column */}
          <div className="p-8" style={{ background: 'var(--color-bg-primary)' }}>
            <div
              className="text-xs tracking-widest uppercase mb-6 font-medium"
              style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
            >
              {content.before.label}
            </div>
            <ul className="space-y-3">
              {content.before.items.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-bg-surface)' }}>
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                      style={{ color: 'var(--color-text-tertiary)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="text-sm" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* After column */}
          <div className="p-8" style={{ background: 'var(--color-bg-secondary)' }}>
            <div
              className="text-xs tracking-widest uppercase mb-6 font-medium"
              style={{ color: 'var(--color-success)', fontFamily: 'var(--font-body)' }}
            >
              {content.after.label}
            </div>
            <ul className="space-y-3">
              {content.after.items.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(74, 222, 128, 0.15)' }}>
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                      style={{ color: 'var(--color-success)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

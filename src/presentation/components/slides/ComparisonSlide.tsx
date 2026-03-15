import { motion } from 'motion/react';
import type { ComparisonSlideContent } from '../../../types/proposal';
import { GradientOrb } from '../../../shared/components/GradientOrb';
import { staggerContainer, fadeUpChild, staticContainer, staticChild } from '../../../shared/utils/animations';
import { useExportMode } from '../../../shared/contexts/ExportModeContext';
import { AppIcon } from '../../../shared/icons/AppIcon';

interface ComparisonSlideProps {
  content: ComparisonSlideContent;
}

export function ComparisonSlide({ content }: ComparisonSlideProps) {
  const isExport = useExportMode();
  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center px-6 md:px-8 py-8 md:py-16 overflow-hidden"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      <GradientOrb size={600} className="top-0 left-0 -translate-x-1/4 -translate-y-1/4" />
      <div className="grain-overlay" />

      <motion.div
        className="relative z-10 w-full max-w-4xl mx-auto"
        variants={isExport ? staticContainer : staggerContainer}
        initial={isExport ? 'visible' : 'hidden'}
        animate={isExport ? 'visible' : undefined}
        whileInView={isExport ? undefined : 'visible'}
        viewport={isExport ? undefined : { once: true, amount: 0.3 }}
      >
        <motion.h2
          variants={isExport ? staticChild : fadeUpChild}
          className="text-2xl md:text-5xl text-center mb-6 md:mb-14"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        >
          {content.heading}
        </motion.h2>

        <motion.div variants={isExport ? staticChild : fadeUpChild} className="grid grid-cols-1 md:grid-cols-2 gap-px">
          {/* Before column */}
          <div className="p-4 md:p-8" style={{ background: 'var(--color-bg-primary)' }}>
            <div
              className="text-xs tracking-widest uppercase mb-3 md:mb-6 font-medium"
              style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
            >
              {content.before.label}
            </div>
            <ul className="space-y-2 md:space-y-3">
              {content.before.items.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-bg-surface)' }}>
                    <AppIcon icon="ui.close" className="w-2.5 h-2.5" strokeWidth={3} style={{ color: 'var(--color-text-tertiary)' }} />
                  </div>
                  <span className="text-sm" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* After column */}
          <div className="p-4 md:p-8" style={{ background: 'var(--color-bg-secondary)' }}>
            <div
              className="text-xs tracking-widest uppercase mb-3 md:mb-6 font-medium"
              style={{ color: 'var(--color-success)', fontFamily: 'var(--font-body)' }}
            >
              {content.after.label}
            </div>
            <ul className="space-y-2 md:space-y-3">
              {content.after.items.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--color-accent-muted)' }}>
                    <AppIcon icon="ui.check" className="w-2.5 h-2.5" strokeWidth={3} style={{ color: 'var(--color-success)' }} />
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

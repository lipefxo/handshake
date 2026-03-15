import { motion } from 'motion/react';
import type { StatsSlideContent } from '../../../types/proposal';
import { AnimatedCounter } from '../../../shared/components/AnimatedCounter';
import { GradientOrb } from '../../../shared/components/GradientOrb';
import { staggerContainer, fadeUpChild, staticContainer, staticChild } from '../../../shared/utils/animations';
import { useExportMode } from '../../../shared/contexts/ExportModeContext';

interface StatsSlideProps {
  content: StatsSlideContent;
}

export function StatsSlide({ content }: StatsSlideProps) {
  const isExport = useExportMode();
  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center px-6 md:px-8 py-8 md:py-16 overflow-hidden"
      style={{ background: 'var(--color-bg-secondary)' }}
    >
      <GradientOrb size={500} className="top-0 left-1/2 -translate-x-1/2 -translate-y-1/4" />
      <div className="grain-overlay" />

      <motion.div
        className="relative z-10 w-full max-w-5xl mx-auto"
        variants={isExport ? staticContainer : staggerContainer}
        initial={isExport ? 'visible' : 'hidden'}
        animate={isExport ? 'visible' : undefined}
        whileInView={isExport ? undefined : 'visible'}
        viewport={isExport ? undefined : { once: true, amount: 0.3 }}
      >
        {content.heading && (
          <motion.p
            variants={isExport ? staticChild : fadeUpChild}
            className="text-center text-sm tracking-widest uppercase mb-8 md:mb-16"
            style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
          >
            {content.heading}
          </motion.p>
        )}

        <div className={`grid gap-px ${content.stats.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
          {content.stats.map((stat, i) => (
            <motion.div
              key={i}
              variants={isExport ? staticChild : fadeUpChild}
              className="flex flex-col items-center justify-center p-4 md:p-10 text-center"
              style={{ background: 'var(--color-bg-secondary)' }}
            >
              <div
                className="text-3xl md:text-6xl font-light mb-2 md:mb-3 tabular-nums"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
              >
                <AnimatedCounter
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  duration={1800}
                />
              </div>
              <div
                className="text-xs md:text-sm font-semibold mb-1 md:mb-1.5 tracking-wide"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}
              >
                {stat.label}
              </div>
              {stat.description && (
                <div
                  className="text-xs"
                  style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
                >
                  {stat.description}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

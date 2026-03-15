import { motion } from 'motion/react';
import type { FeaturesSlideContent } from '../../../types/proposal';
import { GradientOrb } from '../../../shared/components/GradientOrb';
import { staggerContainer, fadeUpChild, staticContainer, staticChild } from '../../../shared/utils/animations';
import { useExportMode } from '../../../shared/contexts/ExportModeContext';
import { useTheme } from '../../../themes/useTheme';
import { AppIcon } from '../../../shared/icons/AppIcon';

interface FeaturesSlideProps {
  content: FeaturesSlideContent;
}

export function FeaturesSlide({ content }: FeaturesSlideProps) {
  const isExport = useExportMode();
  const { theme } = useTheme();

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center px-6 md:px-8 py-8 md:py-16 overflow-hidden"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      <GradientOrb size={600} className="bottom-0 right-0 translate-x-1/4 translate-y-1/4" />
      <div className="grain-overlay" />

      <motion.div
        className="relative z-10 w-full max-w-5xl mx-auto"
        variants={isExport ? staticContainer : staggerContainer}
        initial={isExport ? 'visible' : 'hidden'}
        animate={isExport ? 'visible' : undefined}
        whileInView={isExport ? undefined : 'visible'}
        viewport={isExport ? undefined : { once: true, amount: 0.2 }}
      >
        <div className="mb-4 md:mb-14 text-center md:text-left">
          <motion.p
            variants={isExport ? staticChild : fadeUpChild}
            className="text-xs tracking-widest uppercase mb-2 md:mb-3"
            style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
          >
            {content.label || 'What we offer'}
          </motion.p>
          <motion.h2
            variants={isExport ? staticChild : fadeUpChild}
            className="text-2xl md:text-5xl"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
          >
            {content.heading}
          </motion.h2>
          {content.subheading && (
            <motion.p
              variants={isExport ? staticChild : fadeUpChild}
              className="mt-3 text-lg"
              style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}
            >
              {content.subheading}
            </motion.p>
          )}
        </div>

        <div className={`grid gap-px ${content.features.length <= 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {content.features.map((feature, i) => (
            <motion.div
              key={i}
              variants={isExport ? staticChild : fadeUpChild}
              className="p-3 md:p-8 group"
              style={{ background: 'var(--color-bg-primary)' }}
              whileHover={{ backgroundColor: theme.colors.bgSecondary }}
              transition={{ duration: 0.2 }}
            >
              {feature.icon && (
                <div className="mb-2 md:mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  <AppIcon icon={feature.icon} size={22} />
                </div>
              )}
              <h3
                className="text-sm md:text-base font-semibold mb-1 md:mb-2"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}
              >
                {feature.title}
              </h3>
              <p
                className="text-xs md:text-sm leading-relaxed"
                style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}
              >
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

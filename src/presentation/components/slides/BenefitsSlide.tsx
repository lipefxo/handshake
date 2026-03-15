import { motion } from 'motion/react';
import type { BenefitsSlideContent } from '../../../types/proposal';
import { GradientOrb } from '../../../shared/components/GradientOrb';
import { staggerContainer, fadeUpChild, staticContainer, staticChild } from '../../../shared/utils/animations';
import { useExportMode } from '../../../shared/contexts/ExportModeContext';
import { useTheme } from '../../../themes/useTheme';
import { AppIcon } from '../../../shared/icons/AppIcon';

interface BenefitsSlideProps {
  content: BenefitsSlideContent;
}

export function BenefitsSlide({ content }: BenefitsSlideProps) {
  const isExport = useExportMode();
  const { theme } = useTheme();

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center px-6 md:px-8 py-8 md:py-16 overflow-hidden"
      style={{ background: 'var(--color-bg-secondary)' }}
    >
      <GradientOrb size={600} className="top-0 left-0 -translate-x-1/3 -translate-y-1/3" />
      <div className="grain-overlay" />

      <motion.div
        className="relative z-10 w-full max-w-5xl mx-auto"
        variants={isExport ? staticContainer : staggerContainer}
        initial={isExport ? 'visible' : 'hidden'}
        animate={isExport ? 'visible' : undefined}
        whileInView={isExport ? undefined : 'visible'}
        viewport={isExport ? undefined : { once: true, amount: 0.2 }}
      >
        <motion.h2
          variants={isExport ? staticChild : fadeUpChild}
          className="text-2xl md:text-5xl text-center mb-6 md:mb-14"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        >
          {content.heading}
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px">
          {content.benefits.map((benefit, i) => (
            <motion.div
              key={i}
              variants={isExport ? staticChild : fadeUpChild}
              className="p-3 md:p-8 flex gap-3 md:gap-5"
              style={{ background: 'var(--color-bg-secondary)' }}
              whileHover={{ backgroundColor: theme.colors.bgSurface }}
              transition={{ duration: 0.2 }}
            >
              {benefit.icon && (
                <div className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
                  <AppIcon icon={benefit.icon} size={22} />
                </div>
              )}
              <div>
                <h3
                  className="text-sm md:text-base font-semibold mb-1 md:mb-2"
                  style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}
                >
                  {benefit.title}
                </h3>
                <p
                  className="text-xs md:text-sm leading-relaxed"
                  style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}
                >
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

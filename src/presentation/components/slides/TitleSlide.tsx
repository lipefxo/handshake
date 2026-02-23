import { motion } from 'motion/react';
import type { TitleSlideContent } from '../../../types/proposal';
import { GradientOrb } from '../../../shared/components/GradientOrb';
import { staggerContainer, fadeUpChild } from '../../../shared/utils/animations';
import { OptimizedImage } from '../OptimizedImage';

interface TitleSlideProps {
  content: TitleSlideContent;
  partnerName?: string;
  companyLogo?: string;
  companyName?: string;
}

export function TitleSlide({ content, partnerName, companyLogo, companyName }: TitleSlideProps) {
  const effectivePartnerName = partnerName || content.partnerName || 'Partner';
  const effectiveCompanyLogo = companyLogo || content.secureBagsLogo;
  const effectiveCompanyName = companyName || 'Company';

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-8 overflow-hidden"
      style={{ background: 'var(--color-bg-primary)' }}>

      {/* Decorative elements */}
      <GradientOrb size={600} className="-top-40 -left-40" />
      <GradientOrb size={400} className="-bottom-20 -right-20" />
      <div className="grain-overlay" />

      {/* Thin horizontal line decoration */}
      <div className="absolute top-1/2 left-0 right-0 h-px pointer-events-none" style={{ background: 'var(--color-border-light)' }} />

      <motion.div
        className="relative z-10 text-center max-w-3xl mx-auto"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
      >
        {/* Logos row */}
        <motion.div variants={fadeUpChild} className="flex items-center justify-center gap-4 md:gap-6 mb-8 md:mb-12">
          {effectiveCompanyLogo ? (
            <OptimizedImage src={effectiveCompanyLogo} alt="Company logo" className="h-8 object-contain opacity-90" />
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-text-secondary)' }} />
              <span className="text-sm font-medium tracking-widest uppercase" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
                {effectiveCompanyName}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2" style={{ color: 'var(--color-text-tertiary)' }}>
            <div className="w-8 h-px bg-current" />
            <span className="text-xs">×</span>
            <div className="w-8 h-px bg-current" />
          </div>

          {content.partnerLogo ? (
            <OptimizedImage src={content.partnerLogo} alt={effectivePartnerName} className="h-8 object-contain opacity-90" />
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium tracking-widest uppercase" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
                {effectivePartnerName}
              </span>
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-text-secondary)' }} />
            </div>
          )}
        </motion.div>

        {/* Main headline */}
        <motion.h1
          variants={fadeUpChild}
          className="text-3xl md:text-7xl leading-tight mb-4 md:mb-6"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text-primary)',
          }}
        >
          {content.headline || 'A Strategic Partnership'}
        </motion.h1>

        {/* Subheadline */}
        {content.subheadline && (
          <motion.p
            variants={fadeUpChild}
            className="text-base md:text-xl mb-6 md:mb-10"
            style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}
          >
            {content.subheadline}
          </motion.p>
        )}

        {/* Date badge */}
        {content.date && (
          <motion.div variants={fadeUpChild}>
            <span
              className="inline-block text-xs tracking-widest uppercase px-4 py-2 rounded-full border"
              style={{
                color: 'var(--color-text-tertiary)',
                borderColor: 'var(--color-border)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {content.date}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Bottom decoration */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, var(--color-text-tertiary), transparent)' }} />
        <span className="text-xs tracking-widest uppercase" style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-tertiary)' }}>
          Scroll
        </span>
      </motion.div>
    </div>
  );
}

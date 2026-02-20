import { motion } from 'motion/react';
import type { TitleSlideContent } from '../../../types/proposal';
import { GradientOrb } from '../../../shared/components/GradientOrb';
import { staggerContainer, fadeUpChild } from '../../../shared/utils/animations';

interface TitleSlideProps {
  content: TitleSlideContent;
}

export function TitleSlide({ content }: TitleSlideProps) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-8 overflow-hidden"
      style={{ background: 'var(--color-bg-primary)' }}>

      {/* Decorative elements */}
      <GradientOrb size={600} color="rgba(255,255,255,0.04)" className="-top-40 -left-40" />
      <GradientOrb size={400} color="rgba(255,255,255,0.03)" className="-bottom-20 -right-20" />
      <div className="grain-overlay" />

      {/* Thin horizontal line decoration */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5 pointer-events-none" />

      <motion.div
        className="relative z-10 text-center max-w-3xl mx-auto"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
      >
        {/* Logos row */}
        <motion.div variants={fadeUpChild} className="flex items-center justify-center gap-6 mb-12">
          {content.secureBagsLogo ? (
            <img src={content.secureBagsLogo} alt="SecureBags" className="h-8 object-contain opacity-90" />
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-white/60" />
              <span className="text-white/60 text-sm font-medium tracking-widest uppercase" style={{ fontFamily: 'var(--font-body)' }}>
                SecureBags
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-white/20">
            <div className="w-8 h-px bg-current" />
            <span className="text-xs">×</span>
            <div className="w-8 h-px bg-current" />
          </div>

          {content.partnerLogo ? (
            <img src={content.partnerLogo} alt={content.partnerName} className="h-8 object-contain opacity-90" />
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-white/60 text-sm font-medium tracking-widest uppercase" style={{ fontFamily: 'var(--font-body)' }}>
                {content.partnerName || 'Partner'}
              </span>
              <div className="w-2 h-2 rounded-full bg-white/60" />
            </div>
          )}
        </motion.div>

        {/* Main headline */}
        <motion.h1
          variants={fadeUpChild}
          className="text-5xl md:text-7xl leading-tight mb-6"
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
            className="text-lg md:text-xl mb-10"
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
        <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
        <span className="text-xs text-white/20 tracking-widest uppercase" style={{ fontFamily: 'var(--font-body)' }}>
          Scroll
        </span>
      </motion.div>
    </div>
  );
}

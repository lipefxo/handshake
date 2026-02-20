import { motion } from 'motion/react';
import type { ClosingSlideContent } from '../../../types/proposal';
import { GradientOrb } from '../../../shared/components/GradientOrb';
import { staggerContainer, fadeUpChild } from '../../../shared/utils/animations';

interface ClosingSlideProps {
  content: ClosingSlideContent;
}

export function ClosingSlide({ content }: ClosingSlideProps) {
  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center px-8 overflow-hidden"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      <GradientOrb size={700} color="rgba(255,255,255,0.04)" className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="grain-overlay" />

      {/* Top decoration */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'var(--color-border)' }} />

      <motion.div
        className="relative z-10 text-center max-w-2xl mx-auto"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
      >
        <motion.p
          variants={fadeUpChild}
          className="text-xs tracking-widest uppercase mb-4"
          style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
        >
          Next steps
        </motion.p>

        <motion.h2
          variants={fadeUpChild}
          className="text-4xl md:text-6xl leading-tight mb-6"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        >
          {content.heading}
        </motion.h2>

        {content.subheading && (
          <motion.p
            variants={fadeUpChild}
            className="text-lg mb-10"
            style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}
          >
            {content.subheading}
          </motion.p>
        )}

        {content.ctaText && (
          <motion.div variants={fadeUpChild}>
            {content.ctaUrl ? (
              <a
                href={content.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold transition-all"
                style={{
                  background: 'var(--color-text-primary)',
                  color: 'var(--color-bg-primary)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {content.ctaText}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            ) : (
              <span
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold"
                style={{
                  background: 'var(--color-text-primary)',
                  color: 'var(--color-bg-primary)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {content.ctaText}
              </span>
            )}
          </motion.div>
        )}

        {/* Contact info */}
        {(content.contactName || content.contactEmail) && (
          <motion.div
            variants={fadeUpChild}
            className="mt-12 pt-8"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            {content.contactName && (
              <p
                className="text-sm font-semibold mb-1"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}
              >
                {content.contactName}
              </p>
            )}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {content.contactEmail && (
                <a
                  href={`mailto:${content.contactEmail}`}
                  className="text-sm transition-colors hover:opacity-100"
                  style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}
                >
                  {content.contactEmail}
                </a>
              )}
              {content.contactPhone && (
                <>
                  <span style={{ color: 'var(--color-border)' }}>·</span>
                  <a
                    href={`tel:${content.contactPhone}`}
                    className="text-sm"
                    style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}
                  >
                    {content.contactPhone}
                  </a>
                </>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* SecureBags wordmark at bottom */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <span
          className="text-xs tracking-widest uppercase"
          style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
        >
          SecureBags
        </span>
      </motion.div>
    </div>
  );
}

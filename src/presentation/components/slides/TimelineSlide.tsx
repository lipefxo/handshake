import { motion } from 'motion/react';
import type { TimelineSlideContent } from '../../../types/proposal';
import { GradientOrb } from '../../../shared/components/GradientOrb';
import { staggerContainer, fadeUpChild } from '../../../shared/utils/animations';
import { RichText } from '../../../shared/components/RichText';

interface TimelineSlideProps {
  content: TimelineSlideContent;
}

export function TimelineSlide({ content }: TimelineSlideProps) {
  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center px-6 md:px-8 py-8 md:py-16 overflow-hidden"
      style={{ background: 'var(--color-bg-secondary)' }}
    >
      <GradientOrb size={500} className="bottom-0 right-0 translate-x-1/3 translate-y-1/3" />
      <div className="grain-overlay" />

      <motion.div
        className="relative z-10 w-full max-w-4xl mx-auto"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.h2
          variants={fadeUpChild}
          className="text-2xl md:text-5xl mb-6 md:mb-14 text-center"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        >
          <RichText text={content.heading} />
        </motion.h2>

        <div className="relative">
          {/* Connecting line */}
          <motion.div
            className="absolute left-[calc(12.5%-0.5px)] md:left-1/2 top-0 bottom-0 w-px"
            style={{ background: 'var(--color-border)' }}
            initial={{ scaleY: 0, originY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
          />

            <div className="space-y-4 md:space-y-8">
            {content.milestones.map((milestone, i) => (
              <motion.div
                key={i}
                variants={fadeUpChild}
                className="flex items-start gap-8 md:gap-0"
              >
                {/* Left side (date on desktop, spacer on mobile) */}
                <div className="hidden md:block w-1/2 pr-12 text-right">
                  {i % 2 === 0 ? (
                    <div>
                      <div className="text-xs tracking-widest uppercase mb-1 font-medium"
                        style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}>
                        <RichText text={milestone.date} />
                      </div>
                      <div className="text-base font-semibold"
                        style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}>
                        <RichText text={milestone.title} />
                      </div>
                      {milestone.description && (
                        <div className="text-sm mt-1"
                          style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>
                          <RichText text={milestone.description} />
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Center dot */}
                <div className="relative flex items-center justify-center flex-shrink-0 w-6 md:w-0">
                  <div className="w-3 h-3 rounded-full border-2 z-10"
                    style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-accent)' }} />
                </div>

                {/* Right side */}
                <div className="flex-1 md:w-1/2 md:pl-12">
                  {/* Mobile: always show; Desktop: only odd items */}
                  <div className="md:hidden">
                    <div className="text-xs tracking-widest uppercase mb-1 font-medium"
                      style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}>
                      <RichText text={milestone.date} />
                    </div>
                    <div className="text-base font-semibold"
                      style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}>
                      <RichText text={milestone.title} />
                    </div>
                    {milestone.description && (
                      <div className="text-sm mt-1"
                        style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>
                        <RichText text={milestone.description} />
                      </div>
                    )}
                  </div>
                  <div className="hidden md:block">
                    {i % 2 !== 0 ? (
                      <div>
                        <div className="text-xs tracking-widest uppercase mb-1 font-medium"
                          style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}>
                          <RichText text={milestone.date} />
                        </div>
                        <div className="text-base font-semibold"
                          style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}>
                          <RichText text={milestone.title} />
                        </div>
                        {milestone.description && (
                          <div className="text-sm mt-1"
                            style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>
                            <RichText text={milestone.description} />
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

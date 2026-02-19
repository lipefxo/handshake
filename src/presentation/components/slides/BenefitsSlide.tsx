import { motion } from 'framer-motion';
import type { BenefitsSlideContent } from '../../../types/proposal';
import { GradientOrb } from '../../../shared/components/GradientOrb';
import { staggerContainer, fadeUpChild } from '../../../shared/utils/animations';

interface BenefitsSlideProps {
  content: BenefitsSlideContent;
}

export function BenefitsSlide({ content }: BenefitsSlideProps) {
  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center px-8 py-16 overflow-hidden"
      style={{ background: 'var(--color-bg-secondary)' }}
    >
      <GradientOrb size={600} color="rgba(255,255,255,0.04)" className="top-0 left-0 -translate-x-1/3 -translate-y-1/3" />
      <div className="grain-overlay" />

      <motion.div
        className="relative z-10 w-full max-w-5xl mx-auto"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.h2
          variants={fadeUpChild}
          className="text-4xl md:text-5xl text-center mb-14"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        >
          {content.heading}
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: 'var(--color-border)' }}>
          {content.benefits.map((benefit, i) => (
            <motion.div
              key={i}
              variants={fadeUpChild}
              className="p-8 flex gap-5"
              style={{ background: 'var(--color-bg-secondary)' }}
              whileHover={{ backgroundColor: 'var(--color-bg-surface)' }}
              transition={{ duration: 0.2 }}
            >
              {benefit.icon && (
                <div className="text-2xl flex-shrink-0 mt-0.5">{benefit.icon}</div>
              )}
              <div>
                <h3
                  className="text-base font-semibold mb-2"
                  style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}
                >
                  {benefit.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
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

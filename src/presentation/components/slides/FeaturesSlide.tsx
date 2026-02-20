import { motion } from 'motion/react';
import type { FeaturesSlideContent } from '../../../types/proposal';
import { GradientOrb } from '../../../shared/components/GradientOrb';
import { staggerContainer, fadeUpChild } from '../../../shared/utils/animations';

interface FeaturesSlideProps {
  content: FeaturesSlideContent;
}

export function FeaturesSlide({ content }: FeaturesSlideProps) {
  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center px-8 py-16 overflow-hidden"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      <GradientOrb size={600} color="rgba(255,255,255,0.03)" className="bottom-0 right-0 translate-x-1/4 translate-y-1/4" />
      <div className="grain-overlay" />

      <motion.div
        className="relative z-10 w-full max-w-5xl mx-auto"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mb-14 text-center md:text-left">
          <motion.p
            variants={fadeUpChild}
            className="text-xs tracking-widest uppercase mb-3"
            style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
          >
            What we offer
          </motion.p>
          <motion.h2
            variants={fadeUpChild}
            className="text-4xl md:text-5xl"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
          >
            {content.heading}
          </motion.h2>
          {content.subheading && (
            <motion.p
              variants={fadeUpChild}
              className="mt-3 text-lg"
              style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}
            >
              {content.subheading}
            </motion.p>
          )}
        </div>

        <div className={`grid gap-px ${content.features.length <= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}
          style={{ background: 'var(--color-border)' }}>
          {content.features.map((feature, i) => (
            <motion.div
              key={i}
              variants={fadeUpChild}
              className="p-8 group"
              style={{ background: 'var(--color-bg-primary)' }}
              whileHover={{ backgroundColor: 'var(--color-bg-secondary)' }}
              transition={{ duration: 0.2 }}
            >
              {feature.icon && (
                <div className="text-2xl mb-4">{feature.icon}</div>
              )}
              <h3
                className="text-base font-semibold mb-2"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}
              >
                {feature.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
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

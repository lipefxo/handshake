import type { Variants } from 'framer-motion';

export const slideVariants: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: { opacity: 0, y: -30, transition: { duration: 0.4 } },
};

export const fadeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: 'easeOut' },
  },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.3 } },
};

export const slideLeftVariants: Variants = {
  hidden: { opacity: 0, x: 100 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: { opacity: 0, x: -50, transition: { duration: 0.4 } },
};

export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: { opacity: 0, scale: 1.05, transition: { duration: 0.4 } },
};

export const blurVariants: Variants = {
  hidden: { opacity: 0, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: 'easeOut' },
  },
  exit: { opacity: 0, filter: 'blur(10px)', transition: { duration: 0.4 } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.3 },
  },
};

export const fadeUpChild: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export const fadeChild: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export function getTransitionVariants(transition?: string): Variants {
  switch (transition) {
    case 'fade': return fadeVariants;
    case 'slide-left': return slideLeftVariants;
    case 'scale': return scaleVariants;
    case 'blur': return blurVariants;
    case 'slide-up':
    default:
      return slideVariants;
  }
}

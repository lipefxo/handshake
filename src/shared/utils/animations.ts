import type { Variants } from 'motion/react';

export const slideVariants: Variants = {
  hidden: { opacity: 0.92, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.56, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0.96, y: -14, transition: { duration: 0.28, ease: 'easeInOut' } },
};

export const fadeVariants: Variants = {
  hidden: { opacity: 0.9, scale: 0.992 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0.96, scale: 1.005, transition: { duration: 0.24, ease: 'easeInOut' } },
};

export const slideLeftVariants: Variants = {
  hidden: { opacity: 0.92, x: 38 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.56, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0.96, x: -20, transition: { duration: 0.28, ease: 'easeInOut' } },
};

export const scaleVariants: Variants = {
  hidden: { opacity: 0.9, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0.96, scale: 1.01, transition: { duration: 0.26, ease: 'easeInOut' } },
};

export const blurVariants: Variants = {
  hidden: { opacity: 0.9, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0.96, filter: 'blur(2px)', transition: { duration: 0.26, ease: 'easeInOut' } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.14 },
  },
};

export const fadeUpChild: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
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

import { motion } from 'motion/react';

interface GradientOrbProps {
  size?: number;
  color?: string;
  className?: string;
  animate?: boolean;
}

export function GradientOrb({ size = 400, color = 'rgba(255,255,255,0.03)', className = '', animate = true }: GradientOrbProps) {
  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at center, ${color}, transparent 70%)`,
        filter: 'blur(40px)',
      }}
      animate={animate ? {
        scale: [1, 1.1, 1],
        opacity: [0.6, 1, 0.6],
      } : undefined}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

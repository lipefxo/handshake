import { motion } from 'motion/react';
import { useTheme } from '../../themes/useTheme';

interface GradientOrbProps {
  size?: number;
  color?: string;
  className?: string;
  animate?: boolean;
}

export function GradientOrb({ size = 400, color = 'rgba(255,255,255,0.03)', className = '', animate = true }: GradientOrbProps) {
  const { theme } = useTheme();
  const gradientColor = color === 'rgba(255,255,255,0.03)' ? theme.colors.gradientStart : color;

  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at center, ${gradientColor}, ${theme.colors.gradientEnd} 70%)`,
        filter: 'blur(40px)',
        opacity: theme.style.decorativeOpacity,
      }}
      animate={animate ? {
        scale: [1, 1.1, 1],
        opacity: [0.6, 1, 0.6],
      } : undefined}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

import { motion } from 'motion/react';
import { staggerContainer } from '../utils/animations';

interface StaggeredRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function StaggeredReveal({ children, className, delay = 0.3 }: StaggeredRevealProps) {
  return (
    <motion.div
      className={className}
      variants={{
        ...staggerContainer,
        visible: {
          transition: { staggerChildren: 0.12, delayChildren: delay },
        },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

import { motion } from 'framer-motion';

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = total > 0 ? (current / (total - 1)) * 100 : 0;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-white/10">
      <motion.div
        className="h-full bg-white/60"
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  );
}

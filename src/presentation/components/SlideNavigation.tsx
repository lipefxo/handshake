import { motion } from 'framer-motion';

interface SlideNavigationProps {
  current: number;
  total: number;
  onNavigate: (index: number) => void;
}

export function SlideNavigation({ current, total, onNavigate }: SlideNavigationProps) {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2.5">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onNavigate(i)}
          className="group relative flex items-center justify-center w-5 h-5"
          aria-label={`Go to slide ${i + 1}`}
        >
          <motion.div
            className="rounded-full"
            animate={{
              width: i === current ? 6 : 4,
              height: i === current ? 6 : 4,
              backgroundColor: i === current ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)',
            }}
            transition={{ duration: 0.2 }}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
          />
        </button>
      ))}
    </div>
  );
}

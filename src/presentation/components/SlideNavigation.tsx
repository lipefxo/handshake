import { motion } from 'motion/react';
import { useTheme } from '../../themes/useTheme';

interface SlideNavigationProps {
  current: number;
  total: number;
  onNavigate: (index: number) => void;
}

export function SlideNavigation({ current, total, onNavigate }: SlideNavigationProps) {
  const { theme } = useTheme();
  const navDotStyle = theme.style.navDotStyle;

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
            className={navDotStyle === 'dash' ? 'rounded-sm' : 'rounded-full'}
            animate={{
              width: navDotStyle === 'dash' ? (i === current ? 16 : 8) : (i === current ? 7 : 5),
              height: navDotStyle === 'dash' ? 4 : (i === current ? 7 : 5),
              backgroundColor:
                navDotStyle === 'outline'
                  ? i === current
                    ? theme.colors.accentMuted
                    : 'transparent'
                  : i === current
                    ? theme.colors.accent
                    : theme.colors.textTertiary,
              borderColor:
                navDotStyle === 'outline'
                  ? i === current
                    ? theme.colors.accent
                    : theme.colors.border
                  : 'transparent',
              borderWidth: navDotStyle === 'outline' ? 1.5 : 0,
            }}
            transition={{ duration: 0.2 }}
            whileHover={{ backgroundColor: theme.colors.accentMuted }}
          />
        </button>
      ))}
    </div>
  );
}

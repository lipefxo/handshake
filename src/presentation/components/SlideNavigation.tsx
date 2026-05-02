import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../themes/useTheme';

interface SlideNavigationProps {
  current: number;
  total: number;
  onNavigate: (index: number) => void;
  backToEditorPath?: string;
}

export function SlideNavigation({ current, total, onNavigate, backToEditorPath }: SlideNavigationProps) {
  const { theme } = useTheme();
  const navDotStyle = theme.style.navDotStyle;
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);
  const [focusedDot, setFocusedDot] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const activeElement = document.activeElement;
    if (
      activeElement instanceof HTMLElement &&
      containerRef.current?.contains(activeElement)
    ) {
      activeElement.blur();
    }
  }, [current]);

  return (
    <>
      {backToEditorPath && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <Link
            to={backToEditorPath}
            className="rounded-full border px-3 py-1.5 text-[11px] font-medium shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{
              borderColor: theme.colors.textPrimary,
              color: theme.colors.bgPrimary,
              backgroundColor: theme.colors.textPrimary,
            }}
            aria-label="Back to proposal editor"
          >
            Back to editor
          </Link>
        </div>
      )}
      <div ref={containerRef} className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2.5">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onNavigate(i)}
          onMouseEnter={() => setHoveredDot(i)}
          onMouseLeave={() => setHoveredDot(null)}
          onFocus={() => setFocusedDot(i)}
          onBlur={() => setFocusedDot(null)}
          className="group relative flex items-center justify-center w-6 h-6 cursor-pointer rounded-full focus-visible:outline-none"
          aria-label={`Go to slide ${i + 1}`}
          aria-current={i === current ? 'true' : undefined}
        >
          <motion.div
            className={navDotStyle === 'dash' ? 'rounded-sm' : 'rounded-full'}
            animate={{
              width: navDotStyle === 'dash' ? (i === current ? 18 : 9) : (i === current ? 8 : 6),
              height: navDotStyle === 'dash' ? 4 : (i === current ? 8 : 6),
              backgroundColor:
                i === current
                  ? theme.colors.accent
                  : hoveredDot === i || focusedDot === i
                    ? theme.colors.accentMuted
                    : theme.colors.textTertiary,
              borderColor: hoveredDot === i || focusedDot === i || i === current ? theme.colors.accent : theme.colors.border,
              borderWidth: hoveredDot === i || focusedDot === i || i === current ? 1.5 : 1,
              opacity: i === current || hoveredDot === i || focusedDot === i ? 1 : 0.62,
              scale: i === current ? 1.06 : hoveredDot === i || focusedDot === i ? 1.12 : 0.94,
            }}
            transition={{ duration: 0.18 }}
          />
        </button>
      ))}
      </div>
    </>
  );
}

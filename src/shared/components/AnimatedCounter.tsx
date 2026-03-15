import { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';
import { easeOutExpo } from '../utils/helpers';
import { useExportMode } from '../contexts/ExportModeContext';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({ value, duration = 1500, prefix = '', suffix = '', className }: AnimatedCounterProps) {
  const isExport = useExportMode();
  const [current, setCurrent] = useState(isExport ? value : 0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isExport || !isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      setCurrent(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isExport, isInView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{current.toLocaleString()}{suffix}
    </span>
  );
}

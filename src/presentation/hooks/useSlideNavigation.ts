import { useCallback, useEffect, useRef, useState } from 'react';

export function useSlideNavigation(total: number) {
  const [current, setCurrent] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  const goTo = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const slides = container.querySelectorAll<HTMLElement>('.slide-section');
    const slide = slides[index];
    if (slide) {
      slide.scrollIntoView({ behavior: 'smooth' });
      setCurrent(index);
    }
  }, []);

  const next = useCallback(() => {
    goTo(Math.min(current + 1, total - 1));
  }, [current, total, goTo]);

  const prev = useCallback(() => {
    goTo(Math.max(current - 1, 0));
  }, [current, goTo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          next();
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          prev();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [next, prev]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isScrolling.current) return;
      const scrollTop = container.scrollTop;
      const height = container.clientHeight;
      const index = Math.round(scrollTop / height);
      if (index !== current) {
        setCurrent(Math.max(0, Math.min(index, total - 1)));
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [current, total]);

  // Touch/swipe support
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const delta = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(delta) > 30) {
        if (delta > 0) next();
        else prev();
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [next, prev]);

  return { current, goTo, containerRef };
}

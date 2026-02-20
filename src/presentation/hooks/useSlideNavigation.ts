import { useCallback, useEffect, useRef, useState } from 'react';

export function useSlideNavigation(total: number) {
  const [current, setCurrent] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const wheelDeltaAccumulator = useRef(0);
  const wheelLockUntil = useRef(0);
  const pendingTargetIndex = useRef<number | null>(null);
  const pendingTargetDeadline = useRef(0);

  const clampIndex = useCallback((index: number) => Math.max(0, Math.min(index, total - 1)), [total]);

  const goTo = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const slides = container.querySelectorAll<HTMLElement>('.slide-section');
    const targetIndex = clampIndex(index);
    const slide = slides[targetIndex];
    if (slide) {
      pendingTargetIndex.current = targetIndex;
      pendingTargetDeadline.current = Date.now() + 650;
      slide.scrollIntoView({ behavior: 'smooth' });
      setCurrent(targetIndex);
    }
  }, [clampIndex]);

  const next = useCallback(() => {
    goTo(current + 1);
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo(current - 1);
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
      const scrollTop = container.scrollTop;
      const height = container.clientHeight;

      if (height <= 0) return;
      const rawIndex = scrollTop / height;
      const targetIndex = pendingTargetIndex.current;

      if (targetIndex !== null) {
        const hasReachedTarget = Math.abs(rawIndex - targetIndex) < 0.16;
        const hasTimedOut = Date.now() > pendingTargetDeadline.current;

        if (hasReachedTarget || hasTimedOut) {
          pendingTargetIndex.current = null;
          pendingTargetDeadline.current = 0;
          setCurrent(clampIndex(Math.round(rawIndex)));
        }
        return;
      }

      const index = clampIndex(Math.round(rawIndex));
      if (index !== current) {
        setCurrent(index);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [current, clampIndex]);

  // Wheel support routed through goTo for smooth, consistent transitions.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const WHEEL_TRIGGER_THRESHOLD = 48;
    const WHEEL_COOLDOWN_MS = 420;

    const handleWheel = (event: WheelEvent) => {
      if (total <= 1) return;

      if (Math.abs(event.deltaY) < 2) return;
      event.preventDefault();

      const now = Date.now();
      if (now < wheelLockUntil.current) return;

      wheelDeltaAccumulator.current += event.deltaY;
      if (Math.abs(wheelDeltaAccumulator.current) < WHEEL_TRIGGER_THRESHOLD) return;

      if (wheelDeltaAccumulator.current > 0) next();
      else prev();

      wheelDeltaAccumulator.current = 0;
      wheelLockUntil.current = now + WHEEL_COOLDOWN_MS;
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [next, prev, total]);

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

  return { current, goTo, next, prev, containerRef };
}

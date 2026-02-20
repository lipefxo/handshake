import { useEffect, useRef, useState } from 'react';

interface IdleTimeoutOptions {
  timeoutMs: number;
  warningMs: number;
  onTimeout: () => void;
}

export function useIdleTimeout({ timeoutMs, warningMs, onTimeout }: IdleTimeoutOptions) {
  const [showWarning, setShowWarning] = useState(false);
  const lastActiveRef = useRef(Date.now());
  const timedOutRef = useRef(false);

  useEffect(() => {
    const markActive = () => {
      lastActiveRef.current = Date.now();
      if (!timedOutRef.current) {
        setShowWarning(false);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        markActive();
      }
    };

    const activityEvents: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'click', 'scroll'];
    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, markActive, { passive: true }),
    );
    document.addEventListener('visibilitychange', onVisibilityChange);

    const interval = window.setInterval(() => {
      const idleMs = Date.now() - lastActiveRef.current;
      if (!timedOutRef.current && idleMs >= warningMs) {
        setShowWarning(true);
      }
      if (!timedOutRef.current && idleMs >= timeoutMs) {
        timedOutRef.current = true;
        onTimeout();
      }
    }, 1000);

    return () => {
      window.clearInterval(interval);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, markActive));
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [onTimeout, timeoutMs, warningMs]);

  return { showWarning };
}

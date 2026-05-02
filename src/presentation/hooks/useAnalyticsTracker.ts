import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import type { Proposal } from '../../types/proposal';

const VISITOR_ID_KEY = 'handshake:analytics-visitor-id';
const FLUSH_INTERVAL_MS = 10_000;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

interface SlideEvent {
  slideIndex: number;
  slideType?: string;
  dwellTimeMs: number;
  enteredAt: string;
}

function getOrCreateVisitorId(): string {
  try {
    const stored = localStorage.getItem(VISITOR_ID_KEY);
    if (stored) return stored;
    const id = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function parseDeviceType(ua: string): 'mobile' | 'tablet' | 'desktop' {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) return 'mobile';
  return 'desktop';
}

function parseBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return 'Edge';
  if (/opr\//i.test(ua)) return 'Opera';
  if (/chrome/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua)) return 'Safari';
  if (/firefox/i.test(ua)) return 'Firefox';
  return 'Other';
}

function parseOS(ua: string): string {
  if (/windows/i.test(ua)) return 'Windows';
  if (/macintosh|mac os x/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  return 'Other';
}

async function postAnalytics(payload: object): Promise<void> {
  const fnUrl = `${SUPABASE_URL}/functions/v1/proposal-analytics`;
  try {
    await fetch(fnUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // best-effort, silently ignore
  }
}

export function useAnalyticsTracker(
  proposal: Proposal | null,
  currentSlideIndex: number,
  enabled: boolean = true,
) {
  const sessionId = useRef<string>(crypto.randomUUID());
  const visitorId = useRef<string>(getOrCreateVisitorId());
  const [initialTimestamp] = useState(() => Date.now());
  const slideEnterTime = useRef<number>(initialTimestamp);
  const pendingEvents = useRef<SlideEvent[]>([]);
  const maxSlideReached = useRef<number>(0);
  const sessionStartTime = useRef<number>(initialTimestamp);
  const prevSlideIndex = useRef<number>(currentSlideIndex);
  const hasFlushed = useRef<boolean>(false);

  const enabledSlides = useMemo(() => proposal?.slides.filter((s) => s.enabled) ?? [], [proposal?.slides]);

  const buildPayload = useCallback((extraEvents: SlideEvent[] = []) => {
    if (!proposal) return null;
    const ua = navigator.userAgent;
    return {
      proposalId: proposal.id,
      visitorId: visitorId.current,
      sessionId: sessionId.current,
      deviceType: parseDeviceType(ua),
      browser: parseBrowser(ua),
      os: parseOS(ua),
      referrer: document.referrer || null,
      userAgent: ua,
      slidesTotal: enabledSlides.length,
      maxSlideReached: maxSlideReached.current,
      durationMs: Date.now() - sessionStartTime.current,
      events: [...pendingEvents.current, ...extraEvents],
    };
  }, [proposal, enabledSlides.length]);

  const flush = useCallback((extraEvents: SlideEvent[] = []) => {
    const payload = buildPayload(extraEvents);
    if (!payload) return;
    pendingEvents.current = [];
    void postAnalytics(payload);
  }, [buildPayload]);

  // Track slide transitions: record dwell time for previous slide, update max
  useEffect(() => {
    if (!enabled || !proposal) return;

    const now = Date.now();
    const prevIndex = prevSlideIndex.current;

    if (prevIndex !== currentSlideIndex) {
      const dwellTimeMs = now - slideEnterTime.current;
      const prevSlide = enabledSlides[prevIndex];

      if (dwellTimeMs > 0) {
        pendingEvents.current.push({
          slideIndex: prevIndex,
          slideType: prevSlide?.type,
          dwellTimeMs,
          enteredAt: new Date(slideEnterTime.current).toISOString(),
        });
      }

      prevSlideIndex.current = currentSlideIndex;
      slideEnterTime.current = now;
    }

    if (currentSlideIndex > maxSlideReached.current) {
      maxSlideReached.current = currentSlideIndex;
    }
  }, [currentSlideIndex, enabled, proposal, enabledSlides]);

  // Periodic flush every 10 seconds
  useEffect(() => {
    if (!enabled || !proposal) return;
    const timer = setInterval(() => flush(), FLUSH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [enabled, proposal, flush]);

  // Flush on page hide / unload
  useEffect(() => {
    if (!enabled || !proposal) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const now = Date.now();
        const finalSlide = enabledSlides[prevSlideIndex.current];
        const dwellTimeMs = now - slideEnterTime.current;
        const finalEvent: SlideEvent | null =
          dwellTimeMs > 0
            ? {
                slideIndex: prevSlideIndex.current,
                slideType: finalSlide?.type,
                dwellTimeMs,
                enteredAt: new Date(slideEnterTime.current).toISOString(),
              }
            : null;

        hasFlushed.current = true;
        flush(finalEvent ? [finalEvent] : []);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Flush on unmount if not already flushed on hide
      if (!hasFlushed.current) {
        flush();
      }
    };
  }, [enabled, proposal, flush, enabledSlides]);
}

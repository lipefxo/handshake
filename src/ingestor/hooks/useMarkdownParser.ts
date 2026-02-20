import { useState, useEffect, useRef } from 'react';
import { markdownToSlides } from '../parser/markdownToSlides';
import type { ParseResult } from '../parser/markdownToSlides';

export interface UseMarkdownParserReturn {
  result: ParseResult | null;
  isLoading: boolean;
  slideCount: number;
  warningCount: number;
  errorCount: number;
  hasBlockingErrors: boolean;
}

export function useMarkdownParser(
  markdown: string,
  debounceMs: number = 500,
): UseMarkdownParserReturn {
  const [result, setResult] = useState<ParseResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!markdown.trim()) {
      setResult(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const parsed = markdownToSlides(markdown);
      setResult(parsed);
      setIsLoading(false);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [markdown, debounceMs]);

  const slideCount = result?.slides.length ?? 0;
  const warningCount = result?.validation.filter((v) => v.status === 'warning').length ?? 0;
  const errorCount =
    (result?.validation.filter((v) => v.status === 'error').length ?? 0) +
    (result?.errors.length ?? 0);
  const hasBlockingErrors = errorCount > 0 || (result?.errors.length ?? 0) > 0;

  return { result, isLoading, slideCount, warningCount, errorCount, hasBlockingErrors };
}

import { motion, AnimatePresence } from 'motion/react';
import type { ParseResult } from './parser/markdownToSlides';
import type { ValidationResult } from './parser/validationLayer';
import type { SlideType } from '../types/proposal';

const MAX_PREVIEW_SLIDES = 20;

const SLIDE_TYPE_ICONS: Record<SlideType, string> = {
  title: '✦',
  intro: '◈',
  stats: '◐',
  features: '▤',
  'bullet-list': '•',
  benefits: '◆',
  testimonial: '❝',
  comparison: '⊞',
  timeline: '◎',
  media: '▣',
  table: '▦',
  closing: '◉',
};

const SLIDE_TYPE_LABELS: Record<SlideType, string> = {
  title: 'Title',
  intro: 'Intro',
  stats: 'Stats',
  features: 'Features',
  'bullet-list': 'Bullet List',
  benefits: 'Benefits',
  testimonial: 'Testimonial',
  comparison: 'Comparison',
  timeline: 'Timeline',
  media: 'Media',
  table: 'Table',
  closing: 'Closing',
};

function getSlidePreviewText(slide: { type: SlideType; content: unknown }): string {
  const c = slide.content as Record<string, unknown>;
  if (!c) return '';

  switch (slide.type) {
    case 'title':     return (c['headline'] as string) ?? (c['partnerName'] as string) ?? '';
    case 'intro':     return (c['heading'] as string) ?? '';
    case 'stats': {
      const stats = c['stats'] as Array<{ label: string }> | undefined;
      return stats ? `${stats.length} metric${stats.length !== 1 ? 's' : ''} detected` : '';
    }
    case 'features': {
      const feats = c['features'] as unknown[] | undefined;
      return (c['heading'] as string) ?? (feats ? `${feats.length} features` : '');
    }
    case 'bullet-list': {
      const items = c['items'] as unknown[] | undefined;
      return (c['heading'] as string) ?? (items ? `${items.length} bullet points` : '');
    }
    case 'benefits': {
      const bens = c['benefits'] as unknown[] | undefined;
      return (c['heading'] as string) ?? (bens ? `${bens.length} benefits` : '');
    }
    case 'testimonial': return (c['author'] as string) ? `"${String(c['quote']).slice(0, 50)}…"` : '';
    case 'comparison':  return (c['heading'] as string) ?? '';
    case 'timeline': {
      const ms = c['milestones'] as unknown[] | undefined;
      return (c['heading'] as string) ?? (ms ? `${ms.length} milestones` : '');
    }
    case 'media':   return (c['caption'] as string) ?? (c['url'] as string) ?? '';
    case 'table': {
      const columns = c['columns'] as unknown[] | undefined;
      const rows = c['rows'] as unknown[] | undefined;
      if (columns && rows) {
        return `${rows.length} row${rows.length !== 1 ? 's' : ''} × ${columns.length} column${columns.length !== 1 ? 's' : ''}`;
      }
      return (c['heading'] as string) ?? '';
    }
    case 'closing': return (c['heading'] as string) ?? '';
    default:        return '';
  }
}

interface SlideCardProps {
  slide: { id: string; type: SlideType; content: unknown };
  validation: ValidationResult | undefined;
  index: number;
  wasInferred: boolean;
}

function SlideCard({ slide, validation, index, wasInferred }: SlideCardProps) {
  const status = validation?.status ?? 'valid';
  const preview = getSlidePreviewText(slide);

  const statusIcon = status === 'error' ? '✕' : status === 'warning' ? '!' : '✓';
  const statusColor =
    status === 'error'
      ? 'text-red-500 bg-red-50 border-red-200'
      : status === 'warning'
        ? 'text-amber-600 bg-amber-50 border-amber-200'
        : 'text-emerald-600 bg-emerald-50 border-emerald-200';
  const cardBorder =
    status === 'error'
      ? 'border-red-100'
      : status === 'warning'
        ? 'border-amber-100'
        : 'border-gray-100';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18, delay: index * 0.03 }}
      className={`bg-white border ${cardBorder} rounded-xl p-3.5 flex gap-3`}
    >
      {/* Status badge */}
      <div className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold ${statusColor}`}>
        {statusIcon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400">{SLIDE_TYPE_ICONS[slide.type]}</span>
          <span className="text-xs font-semibold text-gray-700">{SLIDE_TYPE_LABELS[slide.type]} slide</span>
          {wasInferred && (
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded font-medium border border-blue-100">
              inferred
            </span>
          )}
        </div>
        {preview && (
          <p className="text-[12px] text-gray-400 mt-0.5 truncate">{preview}</p>
        )}

        {/* Validation messages */}
        {validation?.messages.map((msg, i) => (
          <p
            key={i}
            className={`text-[11px] mt-1 ${msg.level === 'error' ? 'text-red-500' : 'text-amber-600'}`}
          >
            {msg.level === 'error' ? '✕ ' : '⚠ '}{msg.message}
          </p>
        ))}
      </div>
    </motion.div>
  );
}

interface IngestorPreviewProps {
  result: ParseResult | null;
  isLoading: boolean;
  slideCount: number;
  warningCount: number;
  errorCount: number;
  isEmpty: boolean;
}

export function IngestorPreview({
  result,
  isLoading,
  slideCount,
  warningCount,
  errorCount,
  isEmpty,
}: IngestorPreviewProps) {
  const visibleSlides = result?.slides.slice(0, MAX_PREVIEW_SLIDES) ?? [];
  const overflow = (result?.slides.length ?? 0) - MAX_PREVIEW_SLIDES;

  return (
    <div className="flex flex-col h-full">
      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {isEmpty && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-48 text-center"
            >
              <div className="text-3xl mb-3 text-gray-200">◎</div>
              <p className="text-sm font-medium text-gray-400">No content yet</p>
              <p className="text-xs text-gray-300 mt-1 max-w-[200px]">
                Paste your markdown or click "Paste example" to get started
              </p>
            </motion.div>
          )}

          {isLoading && !isEmpty && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-10"
            >
              <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
            </motion.div>
          )}

          {result?.errors.map((err, i) => (
            <motion.div
              key={`err-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-600"
            >
              <span className="font-semibold">Error:</span> {err}
            </motion.div>
          ))}

          {!isLoading && visibleSlides.map((slide, i) => (
            <SlideCard
              key={slide.id}
              slide={slide}
              validation={result?.validation[i]}
              index={i}
              wasInferred={result?.validation[i] !== undefined && false}
            />
          ))}

          {overflow > 0 && (
            <motion.p
              key="overflow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-center text-gray-400 py-2"
            >
              +{overflow} more slides (not shown in preview)
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Status bar */}
      {result && !isEmpty && (
        <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/80 px-4 py-2.5">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="font-medium text-gray-700">{slideCount} slide{slideCount !== 1 ? 's' : ''} detected</span>
            {warningCount > 0 && (
              <span className="text-amber-600">· {warningCount} warning{warningCount !== 1 ? 's' : ''}</span>
            )}
            {errorCount > 0 && (
              <span className="text-red-500">· {errorCount} error{errorCount !== 1 ? 's' : ''}</span>
            )}
            {warningCount === 0 && errorCount === 0 && (
              <span className="text-emerald-600">· All slides valid</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

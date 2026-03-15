import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { SlideConfig } from '../../types/proposal';
import { useTheme } from '../../themes/useTheme';

interface TableOfContentsProps {
  slides: SlideConfig[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

const SLIDE_TYPE_LABELS: Record<string, string> = {
  title: 'Title',
  intro: 'Introduction',
  stats: 'Statistics',
  features: 'Features',
  'bullet-list': 'Key Points',
  testimonial: 'Testimonial',
  comparison: 'Comparison',
  timeline: 'Timeline',
  media: 'Media',
  benefits: 'Benefits',
  table: 'Table',
  closing: 'Closing',
};

function getSlideLabel(slide: SlideConfig): string {
  if (slide.customLabel) return slide.customLabel;
  const content = slide.content as Record<string, unknown>;
  if (content.heading && typeof content.heading === 'string') return content.heading;
  if (content.headline && typeof content.headline === 'string') return content.headline;
  return SLIDE_TYPE_LABELS[slide.type] || slide.type;
}

interface TocGroup {
  groupId: string | null;
  groupTitle: string | null;
  slides: Array<{ slide: SlideConfig; globalIndex: number }>;
}

export function TableOfContents({ slides, currentIndex, onNavigate }: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();

  const groups = useMemo(() => {
    const result: TocGroup[] = [];
    let currentGroup: TocGroup | null = null;

    slides.forEach((slide, index) => {
      const groupId = slide.groupId ?? null;

      if (groupId && currentGroup?.groupId === groupId) {
        currentGroup.slides.push({ slide, globalIndex: index });
      } else {
        currentGroup = {
          groupId,
          groupTitle: slide.groupTitle ?? null,
          slides: [{ slide, globalIndex: index }],
        };
        result.push(currentGroup);
      }
    });

    return result;
  }, [slides]);

  const handleNavigate = (index: number) => {
    onNavigate(index);
    setIsOpen(false);
  };

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 backdrop-blur-sm"
        style={{
          backgroundColor: isOpen ? theme.colors.accent : `${theme.colors.textPrimary}15`,
          color: isOpen ? theme.colors.bgPrimary : theme.colors.textSecondary,
          border: `1px solid ${isOpen ? theme.colors.accent : theme.colors.border}`,
        }}
        title={isOpen ? 'Close table of contents' : 'Table of contents'}
        aria-label={isOpen ? 'Close table of contents' : 'Open table of contents'}
        aria-expanded={isOpen}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="2" y1="3.5" x2="12" y2="3.5" />
          <line x1="2" y1="7" x2="9" y2="7" />
          <line x1="2" y1="10.5" x2="11" y2="10.5" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -8, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute left-10 top-1/2 -translate-y-1/2 min-w-[200px] max-w-[280px] max-h-[60vh] overflow-y-auto rounded-xl shadow-xl backdrop-blur-md py-2 px-1"
            style={{
              backgroundColor: `${theme.colors.bgPrimary}f0`,
              border: `1px solid ${theme.colors.border}`,
              scrollbarWidth: 'thin',
            }}
          >
            {groups.map((group, groupIndex) => (
              <div key={group.groupId ?? `ungrouped-${groupIndex}`}>
                {group.groupId && group.groupTitle && (
                  <div
                    className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: theme.colors.textTertiary }}
                  >
                    {group.groupTitle}
                  </div>
                )}
                {group.slides.map(({ slide, globalIndex }) => {
                  const isCurrent = globalIndex === currentIndex;
                  return (
                    <button
                      key={slide.id}
                      onClick={() => handleNavigate(globalIndex)}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors duration-100 flex items-center gap-2"
                      style={{
                        backgroundColor: isCurrent ? `${theme.colors.accent}18` : 'transparent',
                        color: isCurrent ? theme.colors.accent : theme.colors.textSecondary,
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrent) {
                          e.currentTarget.style.backgroundColor = `${theme.colors.textPrimary}08`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrent) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: isCurrent ? theme.colors.accent : theme.colors.textTertiary,
                          opacity: isCurrent ? 1 : 0.5,
                        }}
                      />
                      <span className="truncate font-medium">{getSlideLabel(slide)}</span>
                      <span
                        className="ml-auto text-[10px] flex-shrink-0"
                        style={{ color: theme.colors.textTertiary }}
                      >
                        {globalIndex + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

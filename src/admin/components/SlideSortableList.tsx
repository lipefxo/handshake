import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent, DragEndEvent, UniqueIdentifier } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'motion/react';
import type { SlideConfig, SlideType } from '../../types/proposal';
import { SlideSortableItem } from './SlideSortableItem';
import { SLIDE_TYPE_META } from '../../data/slideDefaults';
import { SlideTypeThumbnail } from './SlideTypeThumbnail';
import { AppIcon } from '../../shared/icons/AppIcon';

const MERGE_HOLD_MS = 1200;
const MERGE_TICK_MS = 50;

interface SlideSortableListProps {
  slides: SlideConfig[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (slides: SlideConfig[]) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (type: SlideType) => void;
  onRenameSlide: (slideId: string, label: string) => void;
  onRenameGroup: (groupId: string, title: string) => void;
  onAssignGroup: (slideId: string, groupId: string | null) => void;
}

export function SlideSortableList({
  slides,
  selectedId,
  onSelect,
  onReorder,
  onToggle,
  onDelete,
  onAdd,
  onRenameSlide,
  onRenameGroup,
  onAssignGroup,
}: SlideSortableListProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const [mergeProgress, setMergeProgress] = useState(0);
  const mergeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mergeStartRef = useRef<number>(0);
  const mergePendingRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const groupedSlides = useMemo(() => {
    const groups: Array<{ id: string; title: string; slides: SlideConfig[] }> = [];
    const groupMap = new Map<string, { id: string; title: string; slides: SlideConfig[] }>();
    const ungrouped: SlideConfig[] = [];

    for (const slide of slides) {
      if (!slide.groupId) {
        ungrouped.push(slide);
        continue;
      }

      const existing = groupMap.get(slide.groupId);
      if (existing) {
        existing.slides.push(slide);
        continue;
      }

      const group = {
        id: slide.groupId,
        title: slide.groupTitle?.trim() || 'Untitled group',
        slides: [slide],
      };
      groupMap.set(slide.groupId, group);
      groups.push(group);
    }

    return { groups, ungrouped };
  }, [slides]);

  const allItemIds = useMemo(() => slides.map((s) => s.id), [slides]);

  /** Flat list of slide ids in visible order (expanded groups then ungrouped) for keyboard nav */
  const flatOrderIds = useMemo(() => {
    const ids: string[] = [];
    for (const group of groupedSlides.groups) {
      if (!(collapsedGroups[group.id] ?? false)) {
        ids.push(...group.slides.map((s) => s.id));
      }
    }
    ids.push(...groupedSlides.ungrouped.map((s) => s.id));
    return ids;
  }, [groupedSlides, collapsedGroups]);

  const listContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listContainerRef.current;
    if (!el) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      if (!selectedId || flatOrderIds.length === 0) return;
      const target = e.target as Node;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      if (!el.contains(target)) return;

      const idx = flatOrderIds.indexOf(selectedId);
      if (idx === -1) return;

      if (e.key === 'ArrowDown' && idx < flatOrderIds.length - 1) {
        e.preventDefault();
        onSelect(flatOrderIds[idx + 1]);
      } else if (e.key === 'ArrowUp' && idx > 0) {
        e.preventDefault();
        onSelect(flatOrderIds[idx - 1]);
      }
    };

    el.addEventListener('keydown', handleKeyDown, true);
    return () => el.removeEventListener('keydown', handleKeyDown, true);
  }, [selectedId, flatOrderIds, onSelect]);

  const clearMergeTimer = useCallback(() => {
    if (mergeTimerRef.current) {
      clearInterval(mergeTimerRef.current);
      mergeTimerRef.current = null;
    }
    setMergeTarget(null);
    setMergeProgress(0);
    mergePendingRef.current = false;
  }, []);

  const startMergeTimer = useCallback((targetId: string) => {
    clearMergeTimer();
    setMergeTarget(targetId);
    mergeStartRef.current = Date.now();
    mergePendingRef.current = true;

    mergeTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - mergeStartRef.current;
      const progress = Math.min((elapsed / MERGE_HOLD_MS) * 100, 100);
      setMergeProgress(progress);

      if (progress >= 100) {
        clearInterval(mergeTimerRef.current!);
        mergeTimerRef.current = null;
      }
    }, MERGE_TICK_MS);
  }, [clearMergeTimer]);

  useEffect(() => {
    return () => clearMergeTimer();
  }, [clearMergeTimer]);

  const findSlideById = useCallback(
    (id: UniqueIdentifier) => slides.find((s) => s.id === id),
    [slides]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      clearMergeTimer();
      return;
    }

    const draggedSlide = findSlideById(active.id);
    const targetSlide = findSlideById(over.id);

    if (!draggedSlide || !targetSlide) {
      clearMergeTimer();
      return;
    }

    const bothUngrouped = !draggedSlide.groupId && !targetSlide.groupId;
    const targetIsString = typeof over.id === 'string';

    if (bothUngrouped && targetIsString) {
      if (mergeTarget !== over.id) {
        startMergeTimer(over.id as string);
      }
    } else {
      clearMergeTimer();
    }
  }, [clearMergeTimer, findSlideById, mergeTarget, startMergeTimer]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    const wasFullyCharged = mergePendingRef.current && mergeProgress >= 100;
    const currentMergeTarget = mergeTarget;

    clearMergeTimer();
    setActiveId(null);

    if (!over) return;

    const draggedSlide = findSlideById(active.id);
    const targetSlide = findSlideById(over.id);

    if (!draggedSlide || !targetSlide) return;

    if (wasFullyCharged && currentMergeTarget === over.id && !draggedSlide.groupId && !targetSlide.groupId) {
      const groupId = `group-${crypto.randomUUID()}`;
      const groupCount = new Set(slides.filter((s) => s.groupId).map((s) => s.groupId)).size;
      const groupTitle = `Group ${groupCount + 1}`;

      const updated = slides.map((s) => {
        if (s.id === active.id || s.id === over.id) {
          return { ...s, groupId, groupTitle };
        }
        return s;
      });
      onReorder(updated);
      return;
    }

    if (targetSlide.groupId && !draggedSlide.groupId) {
      onAssignGroup(draggedSlide.id, targetSlide.groupId);
      return;
    }

    if (!targetSlide.groupId && draggedSlide.groupId) {
      onAssignGroup(draggedSlide.id, null);
      return;
    }

    if (draggedSlide.groupId && targetSlide.groupId && draggedSlide.groupId !== targetSlide.groupId) {
      onAssignGroup(draggedSlide.id, targetSlide.groupId);
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = slides.findIndex((s) => s.id === active.id);
      const newIndex = slides.findIndex((s) => s.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(arrayMove(slides, oldIndex, newIndex));
      }
    }
  }, [clearMergeTimer, findSlideById, mergeProgress, mergeTarget, onAssignGroup, onReorder, slides]);

  const activeSlide = activeId ? findSlideById(activeId) : null;

  return (
    <div className="flex min-h-0 flex-col h-full">
      <div
        ref={listContainerRef}
        className="flex-1 min-h-0 overflow-y-auto admin-scroll px-3 pt-3 space-y-1.5"
        tabIndex={0}
      >
        <div className="grid grid-cols-2 gap-1.5 pb-1.5">
          <div className="relative col-span-2">
            <button
              type="button"
              onClick={() => setShowPicker(!showPicker)}
              className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-gray-200 rounded-xl text-xs font-medium text-gray-500 bg-white hover:bg-gray-50 transition-colors"
              aria-expanded={showPicker}
              aria-controls="slide-type-picker"
            >
              <AppIcon icon="ui.add" className="w-3.5 h-3.5" />
              Add slide
            </button>

            {showPicker && (
              <div
                id="slide-type-picker"
                className="absolute left-0 right-0 top-full mt-1.5 border border-gray-200 rounded-xl shadow-lg shadow-black/10 bg-white overflow-hidden z-30"
              >
                <div className="p-2 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 px-2 py-1">Choose slide type</p>
                </div>
                <div className="p-2 max-h-64 overflow-y-auto">
                  {(Object.keys(SLIDE_TYPE_META) as SlideType[]).map((type) => {
                    const meta = SLIDE_TYPE_META[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          onAdd(type);
                          setShowPicker(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <SlideTypeThumbnail type={type} className="h-8 w-10 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-gray-900">{meta.label}</p>
                          <p className="text-xs text-gray-400">{meta.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <p className="col-span-2 px-1 text-[10px] text-gray-400">
            Tip: drag and hold one slide over another to group them.
          </p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={allItemIds} strategy={verticalListSortingStrategy}>
            {groupedSlides.groups.map((group) => {
              const isCollapsed = collapsedGroups[group.id] ?? false;
              return (
                <div key={group.id} className="rounded-xl border border-gray-200 bg-white">
                  <div className="flex items-center gap-2 px-2.5 py-2 border-b border-gray-100">
                    <button
                      type="button"
                      onClick={() => setCollapsedGroups((prev) => ({ ...prev, [group.id]: !isCollapsed }))}
                      className="h-5 w-5 rounded-md border border-gray-200 text-gray-500 transition-colors"
                      title={isCollapsed ? 'Expand group' : 'Collapse group'}
                      aria-label={isCollapsed ? 'Expand group' : 'Collapse group'}
                      aria-expanded={!isCollapsed}
                    >
                      <AppIcon icon="ui.chevron-down" className={`h-3.5 w-3.5 mx-auto transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                    </button>
                    <input
                      value={group.title}
                      onChange={(event) => onRenameGroup(group.id, event.target.value)}
                      onKeyDown={(event) => event.stopPropagation()}
                      maxLength={40}
                      className="min-w-0 flex-1 rounded-md border border-transparent px-1.5 py-0.5 text-xs font-semibold text-gray-900 outline-none focus:bg-gray-50"
                    />
                    <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                      {group.slides.length} {group.slides.length === 1 ? 'slide' : 'slides'}
                    </span>
                  </div>
                  {!isCollapsed && (
                    <div className="space-y-1.5 p-1.5">
                      <AnimatePresence initial={false}>
                        {group.slides.map((slide) => (
                          <motion.div
                            key={slide.id}
                            layout="position"
                            initial={false}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                          >
                            <SlideSortableItem
                              slide={slide}
                              isSelected={slide.id === selectedId}
                              onSelect={() => onSelect(slide.id)}
                              onToggle={() => onToggle(slide.id)}
                              onDelete={() => onDelete(slide.id)}
                              onRename={(label) => onRenameSlide(slide.id, label)}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              );
            })}

            {groupedSlides.ungrouped.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {groupedSlides.groups.length > 0 && (
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Ungrouped</p>
                )}
                <AnimatePresence initial={false}>
                  {groupedSlides.ungrouped.map((slide) => (
                    <motion.div
                      key={slide.id}
                      layout="position"
                      initial={false}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                    >
                      <SlideSortableItem
                        slide={slide}
                        isSelected={slide.id === selectedId}
                        mergeProgress={mergeTarget === slide.id ? mergeProgress : undefined}
                        onSelect={() => onSelect(slide.id)}
                        onToggle={() => onToggle(slide.id)}
                        onDelete={() => onDelete(slide.id)}
                        onRename={(label) => onRenameSlide(slide.id, label)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </SortableContext>

          <DragOverlay dropAnimation={null}>
            {activeSlide && (
              <div className="opacity-90 shadow-lg rounded-xl">
                <SlideSortableItem
                  slide={activeSlide}
                  isSelected={activeSlide.id === selectedId}
                  onSelect={() => {}}
                  onToggle={() => {}}
                  onDelete={() => {}}
                  onRename={() => {}}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {slides.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-gray-400">No slides yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

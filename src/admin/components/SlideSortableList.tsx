import { useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
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

interface SlideSortableListProps {
  slides: SlideConfig[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (slides: SlideConfig[]) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (type: SlideType) => void;
  onRenameSlide: (slideId: string, label: string) => void;
  onCreateGroupFromSlide: (slideId: string) => void;
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
  onCreateGroupFromSlide,
  onRenameGroup,
  onAssignGroup,
}: SlideSortableListProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
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

  const groupOptions = useMemo(
    () => groupedSlides.groups.map((group) => ({ id: group.id, title: group.title })),
    [groupedSlides.groups]
  );

  const handleDragEnd = (sectionSlides: SlideConfig[], event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sectionSlides.findIndex((slide) => slide.id === active.id);
      const newIndex = sectionSlides.findIndex((slide) => slide.id === over.id);
      const movedSection = arrayMove(sectionSlides, oldIndex, newIndex);
      const sectionIds = new Set(sectionSlides.map((slide) => slide.id));
      let cursor = 0;
      onReorder(
        slides.map((slide) => {
          if (!sectionIds.has(slide.id)) return slide;
          const nextSlide = movedSection[cursor];
          cursor += 1;
          return nextSlide;
        })
      );
    }
  };

  const selectedSlide = slides.find((slide) => slide.id === selectedId) ?? null;

  return (
    <div className="flex min-h-0 flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto admin-scroll px-3 pt-3 space-y-1.5">
        <div className="grid grid-cols-2 gap-1.5 pb-1.5">
          <button
            onClick={() => {
              if (selectedSlide) onCreateGroupFromSlide(selectedSlide.id);
            }}
            disabled={!selectedSlide}
            className="w-full flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            title={selectedSlide ? 'Create group from selected slide' : 'Select a slide to create a group'}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h5l2 2h11v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
            Group selected
          </button>
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-gray-200 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors bg-white"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add slide
          </button>
        </div>

        {showPicker && (
          <div className="bg-white border border-gray-100 rounded-xl shadow-lg shadow-black/10 overflow-hidden z-20">
            <div className="p-2 border-b border-gray-50">
              <p className="text-xs font-semibold text-gray-500 px-2 py-1">Choose slide type</p>
            </div>
            <div className="p-2 max-h-64 overflow-y-auto">
              {(Object.keys(SLIDE_TYPE_META) as SlideType[]).map((type) => {
                const meta = SLIDE_TYPE_META[type];
                return (
                  <button
                    key={type}
                    onClick={() => {
                      onAdd(type);
                      setShowPicker(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <SlideTypeThumbnail type={type} className="h-8 w-10 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-700">{meta.label}</p>
                      <p className="text-xs text-gray-400">{meta.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {groupedSlides.groups.map((group) => {
          const isCollapsed = collapsedGroups[group.id] ?? false;
          return (
            <div key={group.id} className="rounded-xl border border-gray-200 bg-white/80">
              <div className="flex items-center gap-2 px-2.5 py-2 border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => setCollapsedGroups((prev) => ({ ...prev, [group.id]: !isCollapsed }))}
                  className="h-5 w-5 rounded-md border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
                  title={isCollapsed ? 'Expand group' : 'Collapse group'}
                >
                  <svg
                    className={`h-3.5 w-3.5 mx-auto transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <input
                  value={group.title}
                  onChange={(event) => onRenameGroup(group.id, event.target.value)}
                  maxLength={40}
                  className="min-w-0 flex-1 rounded-md border border-transparent px-1.5 py-0.5 text-xs font-semibold text-gray-700 outline-none focus:border-gray-200 focus:bg-white"
                />
                <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                  {group.slides.length} {group.slides.length === 1 ? 'slide' : 'slides'}
                </span>
              </div>
              {!isCollapsed && (
                <div className="space-y-1.5 p-1.5">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(group.slides, event)}
                  >
                    <SortableContext items={group.slides.map((slide) => slide.id)} strategy={verticalListSortingStrategy}>
                      <AnimatePresence initial={false}>
                        {group.slides.map((slide) => (
                          <motion.div
                            key={slide.id}
                            layout
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.98 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                          >
                            <SlideSortableItem
                              slide={slide}
                              groups={groupOptions}
                              isSelected={slide.id === selectedId}
                              onSelect={() => onSelect(slide.id)}
                              onToggle={() => onToggle(slide.id)}
                              onDelete={() => onDelete(slide.id)}
                              onRename={(label) => onRenameSlide(slide.id, label)}
                              onGroupChange={(groupId) => onAssignGroup(slide.id, groupId)}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </SortableContext>
                  </DndContext>
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => handleDragEnd(groupedSlides.ungrouped, event)}
            >
              <SortableContext items={groupedSlides.ungrouped.map((slide) => slide.id)} strategy={verticalListSortingStrategy}>
                <AnimatePresence initial={false}>
                  {groupedSlides.ungrouped.map((slide) => (
                    <motion.div
                      key={slide.id}
                      layout
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <SlideSortableItem
                        slide={slide}
                        groups={groupOptions}
                        isSelected={slide.id === selectedId}
                        onSelect={() => onSelect(slide.id)}
                        onToggle={() => onToggle(slide.id)}
                        onDelete={() => onDelete(slide.id)}
                        onRename={(label) => onRenameSlide(slide.id, label)}
                        onGroupChange={(groupId) => onAssignGroup(slide.id, groupId)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {slides.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-gray-400">No slides yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}


import { useState } from 'react';
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
import type { SlideConfig, SlideType } from '../../types/proposal';
import { SlideSortableItem } from './SlideSortableItem';
import { SLIDE_TYPE_META } from '../../data/slideDefaults';

interface SlideSortableListProps {
  slides: SlideConfig[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (slides: SlideConfig[]) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (type: SlideType) => void;
}

export function SlideSortableList({
  slides,
  selectedId,
  onSelect,
  onReorder,
  onToggle,
  onDelete,
  onAdd,
}: SlideSortableListProps) {
  const [showPicker, setShowPicker] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = slides.findIndex((s) => s.id === active.id);
      const newIndex = slides.findIndex((s) => s.id === over.id);
      onReorder(arrayMove(slides, oldIndex, newIndex));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto admin-scroll px-3 pt-3 space-y-1.5">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {slides.map((slide) => (
              <SlideSortableItem
                key={slide.id}
                slide={slide}
                isSelected={slide.id === selectedId}
                onSelect={() => onSelect(slide.id)}
                onToggle={() => onToggle(slide.id)}
                onDelete={() => onDelete(slide.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {slides.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-gray-400">No slides yet.</p>
          </div>
        )}
      </div>

      {/* Add slide button */}
      <div className="px-3 py-3 border-t border-gray-100 relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-200 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add slide
        </button>

        {showPicker && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-gray-100 rounded-xl shadow-lg shadow-black/10 overflow-hidden z-20">
            <div className="p-2 border-b border-gray-50">
              <p className="text-xs font-semibold text-gray-500 px-2 py-1">Choose slide type</p>
            </div>
            <div className="p-2 max-h-64 overflow-y-auto">
              {(Object.keys(SLIDE_TYPE_META) as SlideType[]).map((type) => {
                const meta = SLIDE_TYPE_META[type];
                return (
                  <button
                    key={type}
                    onClick={() => { onAdd(type); setShowPicker(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-sm w-5 text-center">{meta.icon}</span>
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
      </div>
    </div>
  );
}


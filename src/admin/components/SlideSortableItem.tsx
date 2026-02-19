import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SlideConfig } from '../../types/proposal';
import { SLIDE_TYPE_META } from '../../data/slideDefaults';

interface SlideSortableItemProps {
  slide: SlideConfig;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

export function SlideSortableItem({
  slide,
  isSelected,
  onSelect,
  onToggle,
  onDelete,
}: SlideSortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const meta = SLIDE_TYPE_META[slide.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? 'border-indigo-200 bg-indigo-50'
          : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
      } ${!slide.enabled ? 'opacity-50' : ''}`}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="flex-shrink-0 p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
          <circle cx="5" cy="4" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="11" cy="4" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="11" cy="12" r="1.5" />
        </svg>
      </button>

      {/* Icon */}
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${
        isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
      }`}>
        {meta.icon}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>
          {meta.label}
        </p>
      </div>

      {/* Toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`flex-shrink-0 w-8 h-4 rounded-full transition-colors relative ${
          slide.enabled ? 'bg-gray-800' : 'bg-gray-200'
        }`}
        title={slide.enabled ? 'Disable slide' : 'Enable slide'}
      >
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
          slide.enabled ? 'left-4.5 translate-x-0' : 'left-0.5'
        }`} style={{ left: slide.enabled ? 'calc(100% - 14px)' : '2px' }} />
      </button>

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="flex-shrink-0 p-1 text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

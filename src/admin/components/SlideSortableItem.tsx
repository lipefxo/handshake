import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SlideConfig } from '../../types/proposal';
import { SLIDE_TYPE_META } from '../../data/slideDefaults';
import { SlideTypeThumbnail } from './SlideTypeThumbnail';
import { AppIcon } from '../../shared/icons/AppIcon';

interface SlideSortableItemProps {
  slide: SlideConfig;
  isSelected: boolean;
  mergeProgress?: number;
  onSelect: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onRename: (label: string) => void;
}

export function SlideSortableItem({
  slide,
  isSelected,
  mergeProgress,
  onSelect,
  onToggle,
  onDelete,
  onRename,
}: SlideSortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  });

  const isMergeTarget = mergeProgress != null && mergeProgress > 0;

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
      className={`group relative flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
        !slide.enabled ? 'opacity-50' : ''
      } ${
        isMergeTarget
          ? 'border-indigo-400 bg-indigo-50'
          : isSelected
            ? 'border-gray-300 bg-gray-50'
            : 'border-gray-100 bg-white hover:border-gray-200'
      }`}
      onClick={onSelect}
    >
      {isMergeTarget && (
        <div
          className="absolute inset-x-0 bottom-0 h-0.5 rounded-b-xl bg-indigo-500 transition-all duration-100 ease-linear"
          style={{ width: `${mergeProgress}%` }}
        />
      )}

      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="flex-shrink-0 p-1 text-gray-300 cursor-grab active:cursor-grabbing"
      >
        <AppIcon icon="ui.drag" className="w-3.5 h-3.5" />
      </button>

      <SlideTypeThumbnail type={slide.type} isSelected={isSelected} className="h-8 w-10 flex-shrink-0" />

      {/* Editable label */}
      <div className="flex-1 min-w-0">
        <input
          value={slide.customLabel || meta.label}
          onChange={(e) => onRename(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          maxLength={32}
          className={`w-full bg-transparent border-0 outline-none text-xs font-medium truncate px-0 py-0 ${
            isSelected ? 'text-gray-900' : 'text-gray-500'
          } focus:bg-gray-50 focus:rounded focus:px-1 transition-all`}
        />
      </div>

      {/* Toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="flex-shrink-0 w-8 h-4 rounded-full transition-colors relative"
        style={{ background: slide.enabled ? '#6366f1' : '#d1d5db' }}
        title={slide.enabled ? 'Disable slide' : 'Enable slide'}
      >
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform`}
          style={{ left: slide.enabled ? 'calc(100% - 14px)' : '2px' }} />
      </button>

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="flex-shrink-0 p-1 text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
      >
        <AppIcon icon="ui.close" className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

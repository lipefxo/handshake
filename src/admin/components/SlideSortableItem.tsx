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
  isBulkSelected?: boolean;
  onBulkSelect?: (shiftKey: boolean) => void;
  onSelect: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onRename: (label: string) => void;
}

export function SlideSortableItem({
  slide,
  isSelected,
  mergeProgress,
  onSelect,
  onToggle,
  onDelete,
  onDuplicate,
  onRename,
  isBulkSelected,
  onBulkSelect,
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
      className={`group relative flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4785c]/50 focus-visible:ring-offset-1 ${
        !slide.enabled ? 'opacity-50' : ''
      } ${
        isMergeTarget
          ? 'border-[#d4785c] bg-[#d4785c]/10'
          : isSelected
            ? 'border-gray-300 bg-gray-50'
          : 'border-gray-100 bg-white hover:border-gray-200'
      }`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-label={`Select slide ${slide.customLabel || meta.label}`}
    >
      {isMergeTarget && (
        <div
          className="absolute inset-x-0 bottom-0 h-0.5 rounded-b-lg bg-[#d4785c] transition-all duration-100 ease-linear"
          style={{ width: `${mergeProgress}%` }}
        />
      )}

      {/* Bulk select checkbox */}
      {onBulkSelect && (
        <input
          type="checkbox"
          checked={isBulkSelected ?? false}
          onChange={(e) => { e.stopPropagation(); onBulkSelect(e.nativeEvent instanceof MouseEvent ? e.nativeEvent.shiftKey : false); }}
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 w-3.5 h-3.5 rounded accent-gray-900 cursor-pointer"
          aria-label="Select slide for bulk action"
        />
      )}

      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-500 cursor-grab active:cursor-grabbing transition-colors"
        aria-label="Drag to reorder slide"
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
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="flex-shrink-0 w-8 h-4 rounded-full transition-colors relative"
        style={{ background: slide.enabled ? '#d4785c' : '#d1d5db' }}
        title={slide.enabled ? 'Disable slide' : 'Enable slide'}
        aria-label={slide.enabled ? 'Disable slide' : 'Enable slide'}
        aria-pressed={slide.enabled}
      >
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform`}
          style={{ left: slide.enabled ? 'calc(100% - 14px)' : '2px' }} />
      </button>

      {/* Duplicate */}
      {onDuplicate && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="flex-shrink-0 p-1 text-gray-300 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-gray-500 transition-all"
          aria-label="Duplicate slide"
          title="Duplicate (Cmd+D)"
        >
          <AppIcon icon="ui.copy" className="w-3 h-3" />
        </button>
      )}

      {/* Delete */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="flex-shrink-0 p-1 text-gray-300 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-red-400 transition-all"
        aria-label="Delete slide"
      >
        <AppIcon icon="ui.close" className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

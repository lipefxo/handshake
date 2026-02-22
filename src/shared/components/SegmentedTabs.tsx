import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useId } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type TabLabel = ReactNode | ((isActive: boolean) => ReactNode);

interface SegmentedTabOption<T extends string> {
  value: T;
  label: TabLabel;
  href?: string;
  disabled?: boolean;
}

interface SegmentedTabsProps<T extends string> {
  value: T;
  options: SegmentedTabOption<T>[];
  onValueChange?: (value: T) => void;
  className?: string;
  tabClassName?: string;
  indicatorLayoutId?: string;
}

const TAB_INDICATOR_TRANSITION = { type: 'spring', stiffness: 380, damping: 34, mass: 0.6 } as const;

export function SegmentedTabs<T extends string>({
  value,
  options,
  onValueChange,
  className,
  tabClassName,
  indicatorLayoutId,
}: SegmentedTabsProps<T>) {
  const id = useId();
  const indicatorId = indicatorLayoutId ?? `segmented-tab-indicator-${id}`;

  return (
    <div
      role="tablist"
      className={cn(
        'relative inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5',
        className,
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        const label = typeof option.label === 'function' ? option.label(isActive) : option.label;
        const sharedClassName = cn(
          'relative inline-flex h-7 items-center justify-center rounded-md px-3 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2',
          isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700',
          option.disabled ? 'pointer-events-none opacity-60' : '',
          tabClassName,
        );

        const inner = (
          <>
            {isActive && (
              <motion.span
                layoutId={indicatorId}
                aria-hidden="true"
                className="absolute inset-0 rounded-md bg-white shadow-sm"
                transition={TAB_INDICATOR_TRANSITION}
              />
            )}
            <span className="relative z-10">{label}</span>
          </>
        );

        if (option.href) {
          return (
            <Link
              key={option.value}
              to={option.href}
              className={sharedClassName}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
            >
              {inner}
            </Link>
          );
        }

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={option.disabled}
            onClick={() => onValueChange?.(option.value)}
            className={sharedClassName}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}

import { AppIcon } from '../../shared/icons/AppIcon';
import type { ReadinessIssue } from './readiness';

interface ReadinessCheckDisplayProps {
  issues: ReadinessIssue[];
  onClickSlide?: (slideIndex: number) => void;
}

export function ReadinessCheckDisplay({ issues, onClickSlide }: ReadinessCheckDisplayProps) {
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
        <AppIcon icon="ui.check" className="h-4 w-4 text-green-600 flex-shrink-0" />
        <p className="text-sm text-green-700">All checks passed. Ready to publish.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 space-y-1">
          {errors.map((issue, i) => (
            <button
              key={i}
              type="button"
              onClick={() => issue.slideIndex !== undefined && onClickSlide?.(issue.slideIndex)}
              className={`flex items-start gap-2 text-left w-full ${issue.slideIndex !== undefined ? 'hover:bg-red-100 rounded px-1 -mx-1 cursor-pointer' : ''}`}
              disabled={issue.slideIndex === undefined}
            >
              <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700">{issue.message}</p>
            </button>
          ))}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 space-y-1">
          {warnings.map((issue, i) => (
            <button
              key={i}
              type="button"
              onClick={() => issue.slideIndex !== undefined && onClickSlide?.(issue.slideIndex)}
              className={`flex items-start gap-2 text-left w-full ${issue.slideIndex !== undefined ? 'hover:bg-amber-100 rounded px-1 -mx-1 cursor-pointer' : ''}`}
              disabled={issue.slideIndex === undefined}
            >
              <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700">{issue.message}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

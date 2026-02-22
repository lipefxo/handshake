import { X } from 'lucide-react';
import { useToastStore, type ToastMessage, type ToastStore } from '../feedback/toastStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const variantStyles: Record<ToastMessage['variant'], string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-slate-200 bg-white text-slate-900',
};

export function ToastViewport() {
  const toasts = useToastStore((state: ToastStore) => state.toasts);
  const dismiss = useToastStore((state: ToastStore) => state.dismiss);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast: ToastMessage) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto rounded-lg border px-3 py-2 shadow-sm backdrop-blur-sm',
            variantStyles[toast.variant],
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs opacity-90">{toast.description}</p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 shrink-0 rounded text-current hover:bg-black/5"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

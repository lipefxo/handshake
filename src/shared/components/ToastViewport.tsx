import { X } from 'lucide-react';
import { useToastStore, type ToastMessage, type ToastStore } from '../feedback/toastStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const variantStyles: Record<ToastMessage['variant'], string> = {
  success: 'border-emerald-200/80 bg-[rgba(79,151,120,0.12)] text-emerald-950',
  error: 'border-red-200/80 bg-[rgba(224,111,93,0.12)] text-red-950',
  info: 'border-[var(--app-border-subtle)] bg-[rgba(247,247,244,0.86)] text-[var(--app-text-primary)]',
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
            'pointer-events-auto rounded-[var(--app-radius-md)] border px-3 py-2 shadow-[var(--app-shadow-soft)] backdrop-blur-sm',
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

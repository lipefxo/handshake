import { create } from 'zustand';

type ToastVariant = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  durationMs: number;
}

export interface ToastStore {
  toasts: ToastMessage[];
  show: (toast: Omit<ToastMessage, 'id'>) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
}

const DEFAULT_DURATION_MS = 3500;
const ERROR_DURATION_MS = 5000;

function createToastId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useToastStore = create<ToastStore>((set) => {
  const enqueueToast = (toast: Omit<ToastMessage, 'id'>): string => {
    const id = createToastId();
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));

    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((entry) => entry.id !== id) }));
    }, toast.durationMs);

    return id;
  };

  return {
    toasts: [],

    show: (toast) => enqueueToast(toast),

    success: (title, description) =>
      enqueueToast({
        title,
        description,
        variant: 'success',
        durationMs: DEFAULT_DURATION_MS,
      }),

    error: (title, description) =>
      enqueueToast({
        title,
        description,
        variant: 'error',
        durationMs: ERROR_DURATION_MS,
      }),

    info: (title, description) =>
      enqueueToast({
        title,
        description,
        variant: 'info',
        durationMs: DEFAULT_DURATION_MS,
      }),

    dismiss: (id) =>
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      })),
  };
});

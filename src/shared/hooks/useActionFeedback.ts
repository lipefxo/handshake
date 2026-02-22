import { useCallback } from 'react';
import { useToastStore } from '../feedback/toastStore';

interface ActionFeedbackOptions<T> {
  successMessage: string;
  errorMessage: string;
  isSuccess?: (result: T) => boolean;
  getErrorDescription?: (result: T) => string | undefined;
}

export function useActionFeedback() {
  const showSuccess = useToastStore((state) => state.success);
  const showError = useToastStore((state) => state.error);

  const executeWithFeedback = useCallback(
    async <T>(action: () => Promise<T>, options: ActionFeedbackOptions<T>): Promise<T> => {
      try {
        const result = await action();
        const isSuccess = options.isSuccess ? options.isSuccess(result) : Boolean(result);

        if (isSuccess) {
          showSuccess(options.successMessage);
        } else {
          showError(options.errorMessage, options.getErrorDescription?.(result));
        }

        return result;
      } catch (error) {
        const description = error instanceof Error ? error.message : undefined;
        showError(options.errorMessage, description);
        throw error;
      }
    },
    [showError, showSuccess],
  );

  return { executeWithFeedback };
}

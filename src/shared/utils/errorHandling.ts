interface ErrorLike {
  code?: unknown;
  message?: unknown;
  details?: unknown;
  hint?: unknown;
}

function asErrorLike(error: unknown): ErrorLike {
  if (!error || typeof error !== 'object') return {};
  return error as ErrorLike;
}

export function getErrorCode(error: unknown): string {
  const code = asErrorLike(error).code;
  return typeof code === 'string' && code.trim() ? code.trim() : 'UNKNOWN';
}

export function appendErrorDiagnostic(message: string, error: unknown): string {
  return `${message} (ref: ${getErrorCode(error)})`;
}

export function logStructuredError(context: string, error: unknown): void {
  const err = asErrorLike(error);
  console.error(context, {
    code: typeof err.code === 'string' ? err.code : undefined,
    message: typeof err.message === 'string' ? err.message : undefined,
    details: typeof err.details === 'string' ? err.details : undefined,
    hint: typeof err.hint === 'string' ? err.hint : undefined,
    raw: error,
  });
}

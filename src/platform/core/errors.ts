/** Recoverable platform errors are safe to present without exposing private data. */
export class PlatformError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'PlatformError';
  }
}
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'The local operation could not be completed.';
}

/** True when fetch/React Query cancelled the request (not a real failure). */
export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  if (error instanceof Error && error.name === 'AbortError') return true;
  if (typeof error === 'object' && error !== null && 'name' in error && (error as { name: string }).name === 'AbortError') {
    return true;
  }
  const message = error instanceof Error ? error.message : String(error);
  return /aborted/i.test(message);
}

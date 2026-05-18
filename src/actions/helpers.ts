export type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export async function safeAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { data: null, error: message };
  }
}

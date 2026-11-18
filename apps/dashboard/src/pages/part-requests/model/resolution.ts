import type { Resolution } from '@/entities/part-request';

// What a resolution leaves in the address's state for the queue it returns
// to, whose note names the request and says what became of it, with the
// request's identifier, so that a second resolution's note is a note of its
// own.
export interface Resolved {
  resolved: Resolution & { requestId: string };
}

// What the address's state holds for the queue, if a resolution left it.
export function resolvedIn(state: unknown): Resolved['resolved'] | null {
  const resolved = (state as Partial<Resolved> | null)?.resolved;
  return resolved === undefined ? null : resolved;
}

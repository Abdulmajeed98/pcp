import { useSyncExternalStore } from 'react';

// A screen as wide as a desk's: Tailwind's `lg`, 64rem, at which a list gains
// a detail pane beside it (the dashboard's DESIGN.md).
const wide = '(min-width: 64rem)';

// Whether the screen is as wide as a desk's now. It changes as the window
// does, and a screen asks it only to choose what to render: what it lays out
// is written with Tailwind's `lg:` like any other class.
export function useWideScreen(): boolean {
  return useSyncExternalStore(
    (changed) => {
      const query = window.matchMedia(wide);
      query.addEventListener('change', changed);
      return () => query.removeEventListener('change', changed);
    },
    () => window.matchMedia(wide).matches,
  );
}

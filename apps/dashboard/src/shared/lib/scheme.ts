import { useSyncExternalStore } from 'react';

// The colour scheme the dashboard is shown in: the light or the dark one, or
// the device's, which follows the device's own setting and is the first
// choice (the root DESIGN.md). The scheme switch chooses it, in both halves.
export type Scheme = 'light' | 'dark' | 'device';

export const schemes: readonly Scheme[] = ['light', 'dark', 'device'];

// Where the browser keeps the scheme chosen with the switch, as it keeps the
// Vendor portal's language. Nothing is kept while the device's is chosen.
// `index.html` reads the same key before the first paint, so that no screen
// flashes the other scheme; the two are kept the same by hand, since that
// script runs before any module, and so cannot import this one.
const rememberedKey = 'scheme';

// Gives the browser's own bar the Stone Frame's colour of the scheme shown
// (DESIGN.md's Do's): `index.html` holds one theme colour for each scheme,
// each for the device's own scheme at first. A chosen scheme makes its own
// apply whatever the device's, and the device's choice gives each its own
// device scheme back. `index.html` does the same before the first paint.
function showTheBarIn(scheme: Scheme): void {
  for (const bar of document.querySelectorAll<HTMLMetaElement>(
    'meta[name="theme-color"][data-scheme]',
  )) {
    const own = bar.dataset.scheme ?? '';
    bar.media =
      scheme === 'device'
        ? `(prefers-color-scheme: ${own})`
        : own === scheme
          ? 'all'
          : 'not all';
  }
}

const listeners = new Set<() => void>();

// Shows the dashboard in a scheme, and remembers it in this browser. The
// document names a chosen scheme in `data-scheme`, which the look's colours
// follow. Every colour changes in one frame: transitions are suppressed for
// that frame, so that nothing smears from one scheme into the other.
export function chooseScheme(scheme: Scheme): void {
  const root = document.documentElement;
  root.setAttribute('data-scheme-changing', '');
  if (scheme === 'device') delete root.dataset.scheme;
  else root.dataset.scheme = scheme;
  showTheBarIn(scheme);
  // Reading a style makes the browser apply the new colours now, while the
  // transitions are still suppressed.
  void getComputedStyle(root).color;
  requestAnimationFrame(() => root.removeAttribute('data-scheme-changing'));

  try {
    if (scheme === 'device') localStorage.removeItem(rememberedKey);
    else localStorage.setItem(rememberedKey, scheme);
  } catch {
    // Not remembered: the choice holds until the page is left.
  }
  for (const listener of listeners) listener();
}

// The scheme chosen now, which a switch shows as pressed.
export function useScheme(): Scheme {
  return useSyncExternalStore(
    (changed) => {
      listeners.add(changed);
      return () => listeners.delete(changed);
    },
    () => {
      const shown = document.documentElement.dataset.scheme;
      return shown === 'light' || shown === 'dark' ? shown : 'device';
    },
  );
}

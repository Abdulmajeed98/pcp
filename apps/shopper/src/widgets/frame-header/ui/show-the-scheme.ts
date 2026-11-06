import type { Scheme } from '@/shared/scheme';
import { mediaOfTheBrowsersBar } from '@/shared/scheme';

// Shows the page in a scheme, in place: the document names a chosen scheme in
// `data-scheme`, which the look's colours follow, and names none for the
// device's. Every colour changes in one frame: transitions are suppressed for
// that frame, so that nothing smears from one scheme into the other.
//
// The browser's bar takes the colour at the top of the page in the scheme
// shown: each page names one colour for each scheme, the light one first, and
// each is made to apply as the server would have written it for this scheme.
export function showTheScheme(scheme: Scheme): void {
  const root = document.documentElement;
  root.setAttribute('data-scheme-changing', '');
  if (scheme === 'device') delete root.dataset.scheme;
  else root.dataset.scheme = scheme;

  const media = mediaOfTheBrowsersBar(scheme);
  const [light, dark] = document.querySelectorAll<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  if (light !== undefined) light.media = media.light;
  if (dark !== undefined) dark.media = media.dark;

  // Reading a style makes the browser apply the new colours now, while the
  // transitions are still suppressed.
  void getComputedStyle(root).color;
  requestAnimationFrame(() => root.removeAttribute('data-scheme-changing'));
}

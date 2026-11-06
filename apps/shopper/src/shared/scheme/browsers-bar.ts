import type { Viewport } from 'next';

import type { Scheme } from './chosen-scheme';

// The colour a page gives the browser's bar in each scheme: the colour at the
// top of the page (DESIGN.md's The feel on a phone).
export interface BarColours {
  light: string;
  dark: string;
}

// When each of a page's two colours applies: the light one in the light
// scheme and the dark one in the dark, each by the device's setting while
// the device's scheme is chosen, and the chosen one alone otherwise. The
// server writes them so with the page, and the scheme switch changes them in
// place.
export function mediaOfTheBrowsersBar(scheme: Scheme): { light: string; dark: string } {
  if (scheme === 'light') return { light: 'all', dark: 'not all' };
  if (scheme === 'dark') return { light: 'not all', dark: 'all' };
  return { light: '(prefers-color-scheme: light)', dark: '(prefers-color-scheme: dark)' };
}

// The theme colours a page's viewport names, the light one first, as the
// scheme switch finds them.
export function browsersBar(colours: BarColours, scheme: Scheme): Viewport['themeColor'] {
  const media = mediaOfTheBrowsersBar(scheme);
  return [
    { media: media.light, color: colours.light },
    { media: media.dark, color: colours.dark },
  ];
}

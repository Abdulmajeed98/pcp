import { describe, expect, it } from '@jest/globals';

import { BadScheme, emulatedMedia, takeTheScheme } from '../colour-scheme.ts';

describe('the colour scheme on the command line', () => {
  it('is taken off the command line, and the rest is left for the inspector', () => {
    expect(
      takeTheScheme(['http://localhost:3002/catalog', '--scheme', 'light', '--app']),
    ).toEqual({ scheme: 'light', rest: ['http://localhost:3002/catalog', '--app'] });
  });

  it('is left to the computer when it is not given', () => {
    expect(takeTheScheme(['http://localhost:3002/catalog', '--app'])).toEqual({
      scheme: undefined,
      rest: ['http://localhost:3002/catalog', '--app'],
    });
  });

  it.each([['sepia'], [undefined]])('is refused when it is %s', (value) => {
    const args = ['http://localhost:3002/catalog', '--scheme'];
    if (value !== undefined) args.push(value);

    expect(() => takeTheScheme(args)).toThrow(BadScheme);
  });
});

describe('the media a tab is shown in', () => {
  // A computer set to reduce motion would otherwise show every tab still.
  it('asks for the colour scheme, and for full motion whatever the computer is set to', () => {
    expect(emulatedMedia('light', {})).toEqual({
      features: [
        { name: 'prefers-color-scheme', value: 'light' },
        { name: 'prefers-reduced-motion', value: 'no-preference' },
      ],
    });
  });

  it('leaves the colour scheme to the computer when none is asked for, and still asks for full motion', () => {
    expect(emulatedMedia(undefined, {})).toEqual({
      features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
    });
  });

  // Taste asks for reduced motion in one tab of its own, and a later call
  // replaces every feature an earlier one set.
  it('keeps the reduced motion Taste asked the tab for', () => {
    expect(emulatedMedia('dark', { reducedMotion: true })).toEqual({
      features: [
        { name: 'prefers-color-scheme', value: 'dark' },
        { name: 'prefers-reduced-motion', value: 'reduce' },
      ],
    });
  });
});

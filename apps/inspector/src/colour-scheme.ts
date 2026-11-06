// The colour scheme the inspector's tabs are shown in, when the command is
// given `--scheme light` or `--scheme dark`. Without it, Chrome follows the
// computer's own appearance, as the dashboard does. Their motion is never
// the computer's: see `emulatedMedia`.

const schemes = ['light', 'dark'] as const;

export type Scheme = (typeof schemes)[number];

// A `--scheme` with no value, or with one other than light or dark.
export class BadScheme extends Error {}

function isScheme(value: string | undefined): value is Scheme {
  return schemes.some((scheme) => scheme === value);
}

// Takes `--scheme` and its value off the command line, and leaves the rest
// for the inspector.
export function takeTheScheme(args: readonly string[]): {
  scheme: Scheme | undefined;
  rest: string[];
} {
  const rest = [...args];
  const at = rest.indexOf('--scheme');
  if (at === -1) return { scheme: undefined, rest };
  const [, value] = rest.splice(at, 2);
  if (!isScheme(value)) throw new BadScheme('--scheme takes light or dark.');
  return { scheme: value, rest };
}

// The parameters of the DevTools protocol's `Emulation.setEmulatedMedia` that
// show a tab in the scheme asked for, if one is, and with the motion Taste
// asks for: reduced in the tab it asks that of, and full in every other.
// Chrome would otherwise take the computer's own setting, and a computer set
// to reduce motion would show the inspector every page still, as a Shopper
// who asked for that sees it, and Taste's tab of its own no different. A
// call replaces every feature an earlier one set, so the reduced motion Taste
// asks for in its tab is asked again.
export function emulatedMedia(scheme: Scheme | undefined, { reducedMotion = false }) {
  return {
    features: [
      ...(scheme === undefined ? [] : [{ name: 'prefers-color-scheme', value: scheme }]),
      { name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' },
    ],
  };
}

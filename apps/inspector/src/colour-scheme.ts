// The colour scheme the inspector's tabs are shown in, when the command is
// given `--scheme light` or `--scheme dark`. Without it, Chrome follows the
// computer's own appearance, as the dashboard does.

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
// show a tab in the scheme. A call replaces every feature an earlier one set,
// so the reduced motion Taste asks for in a tab of its own is asked again.
export function emulatedMedia(scheme: Scheme, { reducedMotion = false }) {
  return {
    features: [
      { name: 'prefers-color-scheme', value: scheme },
      ...(reducedMotion ? [{ name: 'prefers-reduced-motion', value: 'reduce' }] : []),
    ],
  };
}

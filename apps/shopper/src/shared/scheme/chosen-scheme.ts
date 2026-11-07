// The colours a Shopper can see every page in: the light scheme, the dark
// one, or the device's, which follows the device's own setting and is the
// first choice (the root DESIGN.md), in the order the switch offers them.
export const schemes = ['light', 'dark', 'device'] as const;

export type Scheme = (typeof schemes)[number];

// The cookie a chosen scheme is kept in, as the chosen currency is. The
// browser sends it with every request, and the server draws the page in it
// before the first paint, so that no page flashes the other scheme. Nothing
// is kept while the device's is chosen.
export const schemeCookie = 'scheme';

export function isScheme(value: unknown): value is Scheme {
  return schemes.some((scheme) => scheme === value);
}

// What the scheme is read from: the cookies of the request being answered,
// which the server hands in (`await cookies()` from `next/headers`). This
// segment imports nothing of the server's own, so that the scheme switch can
// use it in the browser too.
export interface RequestCookies {
  get(name: string): { value: string } | undefined;
}

// The scheme the Shopper has chosen, read from the request's cookies: the
// device's when the browser sends no choice, or one that is neither light
// nor dark.
export function schemeIn(cookies: RequestCookies): Scheme {
  const kept = cookies.get(schemeCookie)?.value;

  return kept === 'light' || kept === 'dark' ? kept : 'device';
}

// The scheme a tap on the phone's one button gives, which turns through the
// three in the switch's order: light, then dark, then the device's, then
// light again.
export function schemeAfter(scheme: Scheme): Scheme {
  return schemes[(schemes.indexOf(scheme) + 1) % schemes.length];
}

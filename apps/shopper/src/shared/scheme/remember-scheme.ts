import type { NextResponse } from 'next/server';

import { type Scheme, schemeCookie } from './chosen-scheme';

// How long a chosen scheme is remembered for: a year, as the language and the
// currency are.
const aYearInSeconds = 60 * 60 * 24 * 365;

// Writes the chosen scheme into the server's answer, which tells the browser
// to keep it for a year, or to forget it when the device's is chosen. A
// cookie that a page's script writes is kept by Safari for seven days at
// most, and one written by the server's answer is not, so only the server
// writes it. No script reads it: the server draws the page in it.
export function rememberScheme(response: NextResponse, scheme: Scheme): void {
  if (scheme === 'device') {
    response.cookies.delete(schemeCookie);
    return;
  }
  response.cookies.set(schemeCookie, scheme, {
    maxAge: aYearInSeconds,
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
  });
}

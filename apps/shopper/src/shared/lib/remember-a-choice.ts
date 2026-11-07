import type { NextResponse } from 'next/server';

// How long a Shopper's choice is remembered for: a year, as the language,
// the currency and the scheme each are.
const aYearInSeconds = 60 * 60 * 24 * 365;

// Writes a Shopper's choice into the server's answer, in its cookie, which
// tells the browser to keep it for a year. A cookie that a page's script
// writes is kept by Safari for seven days at most, and one written by the
// server's answer is not, so only the server writes it.
//
// It is sent with every request to the Shopper app and to nothing else. No
// script reads it. A link from another site still sends it, so that a
// Shopper who arrives from one sees their own choice.
export function rememberAChoice(
  response: NextResponse,
  cookie: string,
  value: string,
): void {
  response.cookies.set(cookie, value, {
    maxAge: aYearInSeconds,
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
  });
}

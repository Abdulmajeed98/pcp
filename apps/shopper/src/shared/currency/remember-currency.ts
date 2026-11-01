import type { NextResponse } from 'next/server';

import { type Currency, currencyCookie } from './chosen-currency';

// How long a chosen currency is remembered for: a year, as the language is.
const aYearInSeconds = 60 * 60 * 24 * 365;

// Writes the chosen currency into the server's answer, which tells the
// browser to keep it for a year. A cookie that a page's script writes is kept
// by Safari for seven days at most, and one written by the server's answer is
// not, so only the server writes it.
//
// It is sent with every request to the Shopper app and to nothing else. No
// script reads it. A link from another site still sends it, so that a Shopper
// who arrives from one sees their own currency.
export function rememberCurrency(response: NextResponse, currency: Currency): void {
  response.cookies.set(currencyCookie, currency, {
    maxAge: aYearInSeconds,
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
  });
}

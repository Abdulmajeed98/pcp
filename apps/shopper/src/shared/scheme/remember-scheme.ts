import type { NextResponse } from 'next/server';

import { rememberAChoice } from '@/shared/lib';

import { type Scheme, schemeCookie } from './chosen-scheme';

// Writes the chosen scheme into the server's answer, for a year
// (`rememberAChoice`), or tells the browser to forget it when the device's
// is chosen. No script reads it: the server draws the page in it.
export function rememberScheme(response: NextResponse, scheme: Scheme): void {
  if (scheme === 'device') {
    response.cookies.delete(schemeCookie);
    return;
  }
  rememberAChoice(response, schemeCookie, scheme);
}

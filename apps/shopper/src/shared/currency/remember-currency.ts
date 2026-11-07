import type { NextResponse } from 'next/server';

import { rememberAChoice } from '@/shared/lib';

import { type Currency, currencyCookie } from './chosen-currency';

// Writes the chosen currency into the server's answer, for a year
// (`rememberAChoice`).
export function rememberCurrency(response: NextResponse, currency: Currency): void {
  rememberAChoice(response, currencyCookie, currency);
}

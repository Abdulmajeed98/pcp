import { cookies } from 'next/headers';

// The two currencies a Shopper can see every price in, by the codes the API
// knows them by. Dinars come first: a Shopper sees prices in dinars until they
// choose dollars (PRC-2).
export const currencies = ['IQD', 'USD'] as const;

export type Currency = (typeof currencies)[number];

// The currency a Shopper starts with, and the one read whenever the browser
// holds no choice the platform knows.
const startingCurrency: Currency = 'IQD';

// The cookie the chosen currency is kept in. The browser sends it with every
// request, and only the server reads it: no script needs it.
export const currencyCookie = 'currency';

export function isCurrency(value: unknown): value is Currency {
  return currencies.some((currency) => currency === value);
}

// The currency the Shopper has chosen, read on the server from the request
// that is being answered. It is IQD when the browser sends no choice, or one
// that is neither of the two.
//
// Every page that shows a price asks the API in this currency, so that a page
// never chooses the currency itself, and every page shows the same one.
export async function chosenCurrency(): Promise<Currency> {
  const kept = (await cookies()).get(currencyCookie)?.value;

  return isCurrency(kept) ? kept : startingCurrency;
}

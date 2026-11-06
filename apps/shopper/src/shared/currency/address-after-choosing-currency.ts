import type { Language } from '@pcp/i18n';

import { returnAddress } from '@/shared/lib';

// The parameters of a Category page's price range, its lowest and its highest
// price. Both are amounts in the currency the Shopper had chosen.
const priceRange = ['lowest', 'highest'];

// The address the currency switch returns the Shopper to, after it has
// written the choice down: the page they were on, in `language`, with its
// query as the page wrote it, but for the price range. That was typed in the
// other currency, and a range of dinars must never be read as dollars, so
// both its ends are dropped. `returnAddress` says what else holds of it.
export function addressAfterChoosingCurrency(language: Language, page: unknown): string {
  return returnAddress(language, page, (name) => !priceRange.includes(name));
}

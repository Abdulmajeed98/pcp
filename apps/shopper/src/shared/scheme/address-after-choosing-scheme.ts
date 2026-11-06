import type { Language } from '@pcp/i18n';

import { returnAddress } from '@/shared/lib';

// The address the scheme switch returns the Shopper to, after it has written
// the choice down: the page they were on, in `language`, with its whole query,
// since the colours change nothing a page lists. `returnAddress` says what
// else holds of it.
export function addressAfterChoosingScheme(language: Language, page: unknown): string {
  return returnAddress(language, page);
}

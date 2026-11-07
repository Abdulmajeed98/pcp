import type { Currency } from '@pcp/api-client';

// The two currencies a Shopper can see prices in, by the API's codes, typed
// by its client so that a code the API does not know fails the type check.
// The commands run in Node, which reads no library's TypeScript, so the list
// is written here, once, for the stand-in API and the Shopper's command line.
export const currencies: readonly Currency[] = ['IQD', 'USD'];

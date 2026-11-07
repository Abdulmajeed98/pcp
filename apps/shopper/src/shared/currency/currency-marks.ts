import type { Currency } from '@pcp/api-client';

// The mark every price carries after its figure, the same in every language
// (`words.md`'s currencies): the code for dinars and the sign for dollars,
// "250 IQD" and "1 $". On a phone the currency switch names its two choices
// by them too.
export const currencyMarks: Record<Currency, string> = { IQD: 'IQD', USD: '$' };

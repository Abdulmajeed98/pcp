// The currencies a Shopper may choose, which every price is quoted and shown
// in (PRC-2). `pricing` converts and orders prices in them, and `browse` and
// `builder` show and add them up.
export const currencies = ['USD', 'IQD'] as const;

export type Currency = (typeof currencies)[number];

// Every price is a whole number of its currency's unit: cents for USD, as a
// Quoted Price in USD is kept, and whole dinars for IQD.
export const centsInADollar = 100;

// What the platform holds about one currency, written once here, so that no
// code asks which currency it has to know these.
export interface CurrencyFacts {
  // The other currency, which a Converted Price in this one is derived from.
  readonly other: Currency;
  // How many of its unit make one of it: 100 cents a dollar, 1 dinar a dinar.
  readonly unitsInOne: number;
  // The step a Converted Price in it is rounded to, in its unit: one whole
  // dollar, or 250 dinars (PRC-3).
  readonly convertedPriceStep: number;
  // How many dinars one of it is worth at a Platform Rate of whole dinars per
  // dollar, in whatever holds the numbers: the rate for a dollar, and `one`
  // for a dinar.
  dinarsInOne<N>(iqdPerUsd: N, one: N): N;
}

export const currencyFacts: Readonly<Record<Currency, CurrencyFacts>> = {
  USD: {
    other: 'IQD',
    unitsInOne: centsInADollar,
    convertedPriceStep: centsInADollar,
    dinarsInOne: (iqdPerUsd) => iqdPerUsd,
  },
  IQD: {
    other: 'USD',
    unitsInOne: 1,
    convertedPriceStep: 250,
    dinarsInOne: (_iqdPerUsd, one) => one,
  },
};

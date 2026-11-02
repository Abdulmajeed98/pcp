// The currencies a Shopper may choose, which every price is quoted and shown
// in (PRC-2).
export const currencies = ['USD', 'IQD'] as const;

export type Currency = (typeof currencies)[number];

// Every price is a whole number of its currency's unit: cents for USD, as a
// Quoted Price in USD is kept, and whole dinars for IQD.
export const centsInADollar = 100;

// The step a Converted Price is rounded to, in its currency's unit: 250
// dinars, or one whole dollar (PRC-3).
export const convertedPriceStep: Readonly<Record<Currency, number>> = {
  IQD: 250,
  USD: centsInADollar,
};

// Arithmetic on positive whole numbers, in whatever holds them: the Offer
// Store's are the database's expressions, so that the conversion is computed
// in the same query that reads the Offers and orders them. The conversion is
// written once, below, in these terms, and every query that converts a price
// builds it from here.
export interface WholeNumbers<N> {
  of(value: number): N;
  plus(a: N, b: N): N;
  times(a: N, b: N): N;
  // a ÷ b, rounded down.
  over(a: N, b: N): N;
  greatest(a: N, b: N): N;
}

// The multiple of the step nearest to numerator ÷ denominator, half a step
// rounding up, and never below one step: a Converted Price that would round
// to 0 is shown as the first step, as the owner decided on 2 November 2026.
// It is exact, with no fraction anywhere: the nearest multiple, half up, is
// ⌊(2n + ds) ÷ 2ds⌋ steps.
function nearestStepTo<N>(
  numbers: WholeNumbers<N>,
  numerator: N,
  denominator: N,
  step: N,
): N {
  const two = numbers.of(2);
  const aStepAsAFraction = numbers.times(denominator, step);
  const steps = numbers.over(
    numbers.plus(numbers.times(two, numerator), aStepAsAFraction),
    numbers.times(two, aStepAsAFraction),
  );
  return numbers.greatest(numbers.times(steps, step), step);
}

// The Converted Price in a currency, in its unit, of a Quoted Price in the
// other currency, in that one's unit, at a Platform Rate of whole dinars per
// dollar (PRC-3). IQD from USD is the cents × the rate ÷ 100, rounded to the
// nearest 250 dinars; USD from IQD is the dinars ÷ the rate, rounded to the
// nearest whole dollar, here in cents, as the dinars × 100 ÷ the rate.
export function convertedPriceIn<N>(
  numbers: WholeNumbers<N>,
  currency: Currency,
  quotedInTheOther: N,
  iqdPerUsd: N,
): N {
  const step = numbers.of(convertedPriceStep[currency]);
  const cents = numbers.of(centsInADollar);
  return currency === 'IQD'
    ? nearestStepTo(numbers, numbers.times(quotedInTheOther, iqdPerUsd), cents, step)
    : nearestStepTo(numbers, numbers.times(quotedInTheOther, cents), iqdPerUsd, step);
}

// The price an Offer shows in the chosen currency: its Quoted Price in that
// currency if there is one, else its Converted Price, which says so.
export class ShownPrice {
  constructor(
    private readonly currency: Currency,
    private readonly amount: number,
    private readonly converted: boolean,
  ) {}

  getCurrency(): Currency {
    return this.currency;
  }

  // In the currency's unit: cents for USD, whole dinars for IQD.
  getAmount(): number {
    return this.amount;
  }

  // Whether it is a Converted Price, which a Shopper sees marked "≈".
  isConverted(): boolean {
    return this.converted;
  }
}

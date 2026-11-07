import { sql, SQL } from 'drizzle-orm';

import { Currency, currencyFacts } from '~/domain/currency/currency';
import { convertedPriceIn, WholeNumbers } from '~/domain/offer/shown-price';

import { offer } from './offer.schema';

// Whole numbers as the database computes them, in `bigint`, so that a price
// at the top of the Offers' limits times the highest rate cannot overflow.
// Its division of two positive whole numbers rounds down.
export const inTheDatabase: WholeNumbers<SQL> = {
  of: (value) => sql`${value}::bigint`,
  plus: (a, b) => sql`(${a} + ${b})`,
  times: (a, b) => sql`(${a} * ${b})`,
  over: (a, b) => sql`(${a} / ${b})`,
  greatest: (a, b) => sql`greatest(${a}, ${b})`,
};

// An Offer's Quoted Price in each currency, in its unit, or null.
const quotedPrice = {
  USD: offer.usdPriceCents,
  IQD: offer.iqdPrice,
} satisfies Record<Currency, unknown>;
function quotedPriceIn(currency: Currency): SQL {
  return sql`${quotedPrice[currency]}`;
}

// An Offer's Shown Price in a currency, in its unit, as the database asks it
// at a Platform Rate: its Quoted Price in that currency if it has one, else
// its Converted Price by the rule in `shown-price.ts`, else null when there
// is no rate. A query that uses it joins the current rate, read in the same
// query as its Offers.
export function shownPriceIn(
  currency: Currency,
  iqdPerUsd: SQL,
): {
  amount: SQL<number | null>;
  converted: SQL<boolean>;
} {
  const quoted = quotedPriceIn(currency);
  const other = quotedPriceIn(currencyFacts[currency].other);
  const converted = convertedPriceIn(
    inTheDatabase,
    currency,
    sql`${other}::bigint`,
    sql`${iqdPerUsd}::bigint`,
  );
  return {
    amount: sql<
      number | null
    >`coalesce(${quoted}::bigint, case when ${iqdPerUsd} is not null and ${other} is not null then ${converted} end)`.mapWith(
      Number,
    ),
    converted: sql<boolean>`${quoted} is null`,
  };
}

import type { VisibleOfferResponse } from '@pcp/api-client';
import { AlwaysEnglish } from '@pcp/ui';
import { getLocale, getTranslations } from 'next-intl/server';
import { Fragment, type ReactNode } from 'react';

import type { Currency } from '@/shared/currency';
import { confirmationIn, warrantyIn } from '@/shared/offer-words';
import { shownPriceText } from '@/shared/price';

// What an Offer's line says of it, as the API answers it, whether on a Part
// page or a Vendor page.
export type OfferDetails = Pick<
  VisibleOfferResponse,
  | 'usdPrice'
  | 'iqdPrice'
  | 'shownPrice'
  | 'inStock'
  | 'warrantyMonths'
  | 'daysSinceConfirmation'
>;

// The Quoted Price the Vendor gave in the currency the Shopper did not
// choose, when the Shown Price is not a Quoted Price: a Converted Price, or
// none at all before the Admin sets the first Platform Rate. Written as the
// platform writes a price, with no "≈", since the Vendor quoted it.
function quotedInTheOtherCurrency(
  offer: OfferDetails,
  chosen: Currency,
): string | undefined {
  if (offer.shownPrice !== null && !offer.shownPrice.converted) return undefined;
  const quoted =
    chosen === 'IQD'
      ? offer.usdPrice === null
        ? undefined
        : { currency: 'USD' as const, amount: offer.usdPrice, converted: false }
      : offer.iqdPrice === null
        ? undefined
        : { currency: 'IQD' as const, amount: String(offer.iqdPrice), converted: false };
  if (quoted === undefined) return undefined;
  const { figure, unit } = shownPriceText(quoted);
  return `${figure} ${unit}`;
}

// An Offer's second line (DESIGN.md's An Offer), in Body Soft Ink: "Out of
// stock" at its head when the Vendor has none, in words, never a colour
// alone; what the Vendor quoted when its price is converted, "Quoted 362 $";
// its warranty in months when the Vendor states one; and how many days ago
// it was confirmed (OFF-7), each apart by a middle dot. The price the Vendor
// quoted is one left-to-right unit in every language.
//
// On a Part page the Offers in stock and out of stock lie under headings of
// their own, so the line says only "Out of stock". On a Vendor page they lie
// under their Categories, so the line says either, "In stock" or "Out of
// stock" (`saysInStock`), and starts with what `first` gives, such as its
// Part's manufacturer.
export async function OfferLine({
  offer,
  currency,
  saysInStock = false,
  first,
}: {
  offer: OfferDetails;
  currency: Currency;
  saysInStock?: boolean;
  first?: ReactNode;
}) {
  const [language, t, part] = await Promise.all([
    getLocale(),
    getTranslations('Offer'),
    getTranslations('Part'),
  ]);
  const quoted = quotedInTheOtherCurrency(offer, currency);
  const warranty = warrantyIn(language, offer.warrantyMonths);

  const pieces: { testId: string; words: ReactNode }[] = [
    ...(first === undefined ? [] : [{ testId: 'offer-first', words: first }]),
    ...(offer.inStock
      ? saysInStock
        ? [{ testId: 'offer-in-stock', words: part('inStock') }]
        : []
      : [{ testId: 'offer-out-of-stock', words: part('outOfStock') }]),
    ...(quoted === undefined
      ? []
      : [
          {
            testId: 'offer-quoted',
            words: t.rich('quoted', {
              price: quoted,
              english: (chunks) => <AlwaysEnglish>{chunks}</AlwaysEnglish>,
            }),
          },
        ]),
    ...(warranty === undefined ? [] : [{ testId: 'offer-warranty', words: warranty }]),
    {
      testId: 'offer-confirmed',
      words: confirmationIn(language, offer.daysSinceConfirmation),
    },
  ];

  return (
    <>
      {pieces.map(({ testId, words }, place) => (
        <Fragment key={testId}>
          {place > 0 && ' · '}
          <span data-testid={testId}>{words}</span>
        </Fragment>
      ))}
    </>
  );
}

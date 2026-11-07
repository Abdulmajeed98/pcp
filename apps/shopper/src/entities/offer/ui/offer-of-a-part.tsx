import type { VisibleOfferResponse } from '@pcp/api-client';
import { AsWritten } from '@pcp/ui';

import type { Currency } from '@/shared/currency';
import { ShownPrice, shownPriceText } from '@/shared/price';
import { Item, type NameAlone } from '@/shared/ui';

import { OfferLine } from './offer-line';

// How many characters of a name and its price a line holds side by side:
// on a 360-pixel phone's sheet, and on a desk's, in Latin or Arabic script.
const sideBySideOnAPhone = 26;
const sideBySide = 52;

// An Offer on a Part page (DESIGN.md's An Offer): an item of the sheet of
// Offers, with its Vendor's name as the Vendor wrote it, its own direction
// kept (LANG-4), as a link to its Vendor page; the leader; its Shown Price,
// drawn by the one component that draws one, with "≈" when converted, in
// Soft Ink when the Vendor has it out of stock, so that a price that cannot
// be bought is not read as one to take; and its line, which says so in
// words, what the Vendor quoted when converted, its warranty and its
// Confirmation. An Offer with no Shown Price, which happens only before the
// Admin sets the first Platform Rate, has nothing at its end, and its line
// says what the Vendor quoted.
//
// A name keeps its words whole by taking the whole line, its leader and
// price on the line under it, as a Part's on a Category page does, when it
// and its price are more than a line holds side by side: on a phone past
// 26 characters together, and at every width past 52, so that a short name
// beside a price of nine digits takes its own line too. A list too narrow
// for its own text, as with a phone's text made larger, stacks every Offer
// so (`data-item="text"`, the theme's rule). Its price settles into the
// sheet's column as the sheet prints (Motion 2), `place` being its place on
// the sheet.
export function OfferOfAPart({
  offer,
  currency,
  vendorAddress,
  place,
}: {
  offer: VisibleOfferResponse;
  currency: Currency;
  vendorAddress: string;
  place: number;
}) {
  const { name } = offer.vendor;
  const price = offer.shownPrice === null ? undefined : shownPriceText(offer.shownPrice);
  const together =
    name.length +
    (price === undefined
      ? 0
      : `${price.approximate ? '≈ ' : ''}${price.figure} ${price.unit}`.length);
  const nameAlone: NameAlone | undefined =
    together > sideBySide
      ? 'always'
      : together > sideBySideOnAPhone
        ? 'on-a-phone'
        : undefined;

  return (
    <Item
      testId="offer"
      data={{
        'data-item': 'text',
        'data-vendor': offer.vendor.id,
        'data-in-stock': String(offer.inStock),
      }}
      place={place}
      nameAlone={nameAlone}
      name={
        <a href={vendorAddress} className="hover-underline">
          <AsWritten>{name}</AsWritten>
        </a>
      }
      end={
        offer.shownPrice === null ? undefined : (
          <ShownPrice
            price={offer.shownPrice}
            className={offer.inStock ? undefined : 'text-muted-foreground'}
          />
        )
      }
      second={<OfferLine offer={offer} currency={currency} />}
    />
  );
}

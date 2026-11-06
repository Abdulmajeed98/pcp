import type { VisibleOfferResponse } from '@pcp/api-client';
import { AsWritten } from '@pcp/ui';

import type { Currency } from '@/shared/currency';
import { ShownPrice } from '@/shared/price';
import { Item, type NameAlone } from '@/shared/ui';

import { OfferLine } from './offer-line';

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
// A long name keeps its words whole by taking the whole line, its leader and
// price on the line under it, as a Part's on a Category page does: on a
// phone past 14 characters, which is all a 360-pixel sheet holds beside a
// converted price in dinars, in Latin or Arabic script, and at every width
// past 40. Its price settles into the sheet's column as the sheet prints
// (Motion 2), `place` being its place on the sheet.
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
  const nameAlone: NameAlone | undefined =
    name.length > 40 ? 'always' : name.length > 14 ? 'on-a-phone' : undefined;

  return (
    <Item
      testId="offer"
      data={{
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

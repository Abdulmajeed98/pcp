import type { VisibleOfferOfVendorResponse } from '@pcp/api-client';
import { AlwaysEnglish } from '@pcp/ui';
import type { ReactNode } from 'react';

import type { Currency } from '@/shared/currency';
import { ShownPrice } from '@/shared/price';
import { Item, whereAPartsNameStands } from '@/shared/ui';

import { OfferLine } from './offer-line';

// An Offer on a Vendor page (DESIGN.md's An Offer, on a Vendor page): an
// item of the sheet of the Vendor's Offers, under its Category's name, as a
// Part is on a Category page. On its start side its Part's photo, or its
// Category's icon in its place (`picture`); then its Part's name, in English
// in every language (LANG-3), as a link to its Part page; the leader; its
// Shown Price, drawn by the one component that draws one, with "≈" when
// converted, in Soft Ink when the Vendor has it out of stock, so that a
// price that cannot be bought is not read as one to take. On its second
// line, its Part's manufacturer in English, then "In stock" or "Out of
// stock" in words, never a colour alone, what the Vendor quoted when
// converted, its warranty and its Confirmation. An Offer with no Shown
// Price, which happens only before the Admin sets the first Platform Rate,
// has nothing at its end, and its line says what the Vendor quoted.
//
// A long name takes the whole line, its leader and price on the line under
// it, as the Long Name Rule has it, and a list too narrow for its own text,
// as with a phone's text made larger, stacks every Offer (the theme's
// `data-item` rule). Its price settles into the sheet's column as the sheet
// prints (Motion 2), `place` being its place on the sheet.
export function OfferOfAVendor({
  offer,
  currency,
  partAddress,
  picture,
  place,
}: {
  offer: VisibleOfferOfVendorResponse;
  currency: Currency;
  partAddress: string;
  picture: ReactNode;
  place: number;
}) {
  const { part } = offer;

  return (
    <Item
      testId="offer"
      data={{ 'data-part': part.id, 'data-in-stock': String(offer.inStock) }}
      place={place}
      nameAlone={whereAPartsNameStands(part.name)}
      picture={picture}
      name={
        <a href={partAddress} className="hover-underline">
          <AlwaysEnglish>{part.name}</AlwaysEnglish>
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
      second={
        <OfferLine
          offer={offer}
          currency={currency}
          saysInStock
          first={<AlwaysEnglish>{part.manufacturer}</AlwaysEnglish>}
        />
      }
    />
  );
}

import type {
  PlatformFiguresResponse,
  VisibleOfferResponse,
  VisiblePartWithSpecificationsResponse,
} from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { getLocale, getTranslations } from 'next-intl/server';

import { OfferOfAPart } from '@/entities/offer';
import { PriceSlip } from '@/entities/part';
import { vendorAddress } from '@/entities/vendor';
import { chosenCurrency } from '@/shared/currency';
import { photographs } from '@/shared/photographs';
import { DimPhotograph, Sheet, SheetGroup, SheetNote, SheetTitle } from '@/shared/ui';

// A Part page's Offers (DESIGN.md's A Part page and An Offer), over a dim
// photograph of a hand setting memory into a board: the price slip, 23rem
// wide, beside the sheet of Offers, 40rem wide, centred and 56 pixels apart
// from 64rem, the slip pinned on the Offers' start side while they scroll
// past (Motion 7), and above them on a phone, where it scrolls with them.
//
// The sheet, titled by how many Vendors offer the Part, says how the Offers
// are ordered: every Visible Offer, in the order the API answers them, which
// is OFF-11's, in stock first and then the lowest Shown Price, none promoted
// or marked out. Under "In stock" those the Vendors have, under "Out of
// stock" the rest, each saying so on its line in words. It closes with what
// "≈" means when a price on it is converted. Both pieces are below the first
// screen, so they print as they come into view (Motion 1, 4).
export async function Offers({
  part,
  offers,
  figures,
}: {
  part: VisiblePartWithSpecificationsResponse;
  offers: readonly VisibleOfferResponse[];
  figures: PlatformFiguresResponse | undefined;
}) {
  const [language, currency, t, categoryPage] = await Promise.all([
    getLocale(),
    chosenCurrency(),
    getTranslations('PartPage'),
    getTranslations('CategoryPage'),
  ]);
  const inStock = offers.filter((offer) => offer.inStock);
  const outOfStock = offers.filter((offer) => !offer.inStock);
  const anyConverted = offers.some((offer) => offer.shownPrice?.converted === true);
  const listed = (group: readonly VisibleOfferResponse[], from: number) =>
    group.map((offer, place) => (
      <OfferOfAPart
        key={offer.vendor.id}
        offer={offer}
        currency={currency}
        vendorAddress={vendorAddress(language, offer.vendor.id)}
        place={from + place}
      />
    ));

  return (
    <section
      id="offers"
      aria-labelledby="offers-title"
      className="relative isolate px-ground-edge py-section-phone md:page-margins md:py-section"
    >
      <DimPhotograph photograph={photographs.handSettingMemory} />
      <div className="mx-auto grid w-full max-w-[40rem] justify-items-center gap-y-10 lg:max-w-none lg:grid-cols-[23rem_minmax(0,40rem)] lg:items-start lg:justify-center lg:gap-x-14">
        <PriceSlip
          partName={part.name}
          offers={offers}
          iqdPerUsd={figures?.iqdPerUsd}
          pinned
        />
        <Sheet print="in-view">
          <SheetTitle id="offers-title">
            {t('offersTitle', {
              count: offers.length,
              countText: formatNumber(offers.length),
            })}
          </SheetTitle>
          <SheetNote>{t('offersNote')}</SheetNote>
          {inStock.length > 0 && (
            <SheetGroup heading={t('inStock')} testId="offers-in-stock">
              {listed(inStock, 0)}
            </SheetGroup>
          )}
          {outOfStock.length > 0 && (
            <SheetGroup heading={t('outOfStock')} testId="offers-out-of-stock">
              {listed(outOfStock, inStock.length)}
            </SheetGroup>
          )}
          {anyConverted && (
            <p
              data-testid="what-approximately-means"
              className="mx-auto mt-group max-w-[34rem] text-center text-muted-foreground"
            >
              {categoryPage('approximately')}
            </p>
          )}
        </Sheet>
      </div>
    </section>
  );
}

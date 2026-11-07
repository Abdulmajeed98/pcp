import type { VisibleOfferOfVendorPageResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { getLocale, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { OfferOfAVendor } from '@/entities/offer';
import { partAddress, PartSquare } from '@/entities/part';
import { vendorAddress } from '@/entities/vendor';
import type { Currency } from '@/shared/currency';
import { whatAPageShows } from '@/shared/lib';
import { Paging, Sheet, SheetAction, SheetGroup, SheetNote, SheetTitle } from '@/shared/ui';

import { offersByCategory } from '../model/offers-by-category';

// The sheet of a Vendor's Offers (DESIGN.md's Its Offers and An Offer, on a
// Vendor page), centred under its coupon: titled by how many Visible Offers
// the Vendor has, saying how they are ordered, and listing a page of them,
// grouped by Category under each Category's name in the page's language, in
// the order the API answers them, the catalog's order of the eight and
// OFF-11's within each, none promoted or marked out. Each leads to its Part
// page. They are paged 20 at a time, the page in the address, the address
// holding `#offers` so that another page opens at the sheet, as with script
// it is drawn again in place, shown printed. It closes with what "≈" means
// when a price on it is converted.
//
// A Vendor with no Visible Offer says so, its coupon still showing how to
// reach it; a page past the last says how many the list has and leads to
// the first; Offers the API did not answer say so and offer to try again,
// at the same address. The sheet is below the coupon, so it prints as it
// comes into view, its prices settling into their column (Motions 1 and 2).
export async function VendorOffers({
  vendorId,
  offers,
  page,
  currency,
}: {
  vendorId: string;
  offers: VisibleOfferOfVendorPageResponse | undefined;
  page: number;
  currency: Currency;
}) {
  const [language, t, categoryName, categoryPage, paging] = await Promise.all([
    getLocale(),
    getTranslations('VendorPage'),
    getTranslations('Category'),
    getTranslations('CategoryPage'),
    getTranslations('Paging'),
  ]);
  const state = whatAPageShows(offers);
  const addressOf = (at: number) => `${vendorAddress(language, vendorId, at)}#offers`;
  const count = offers?.totalElements ?? 0;

  // What the sheet says under its title, and what it holds: the page of
  // Offers, or why it lists none and, but for a Vendor with none, the one
  // way out.
  const { note, holds } = ((): { note: ReactNode; holds: ReactNode } => {
    // Why the sheet lists no Offer, in Body large, as what the page says.
    const saying = (words: string) => (
      <SheetNote lead>
        <span data-testid="offers-say" data-state={state.kind}>
          {words}
        </span>
      </SheetNote>
    );
    switch (state.kind) {
      case 'listed':
        return {
          note: <SheetNote>{t('offersNote')}</SheetNote>,
          holds: (
            <>
              {offersByCategory(state.page.content).map(({ category, offers: ofIt }) => {
                const before = state.page.content.indexOf(ofIt[0]);
                return (
                  <SheetGroup
                    key={category}
                    heading={categoryName(category)}
                    testId={`offers-of-${category}`}
                  >
                    {ofIt.map((offer, place) => (
                      <OfferOfAVendor
                        key={offer.part.id}
                        offer={offer}
                        currency={currency}
                        partAddress={partAddress(language, offer.part.id)}
                        picture={<PartSquare part={offer.part} />}
                        place={before + place}
                      />
                    ))}
                  </SheetGroup>
                );
              })}
              <Paging
                page={page}
                totalPages={state.page.totalPages}
                addressOf={addressOf}
              />
              {state.page.content.some((offer) => offer.shownPrice?.converted === true) && (
                <p
                  data-testid="what-approximately-means"
                  className="mx-auto mt-group max-w-[34rem] text-center text-muted-foreground"
                >
                  {categoryPage('approximately')}
                </p>
              )}
            </>
          ),
        };
      case 'none':
        return {
          note: saying(t('none')),
          holds: (
            <p className="mt-2.5 text-center text-sm text-muted-foreground">
              {categoryPage('noneYetLine')}
            </p>
          ),
        };
      case 'past-the-end':
        return {
          note: saying(
            paging('pastTheEnd', {
              pages: state.totalPages,
              pagesText: formatNumber(state.totalPages),
            }),
          ),
          holds: (
            <SheetAction kind="primary" address={addressOf(1)} testId="to-the-first-page">
              {paging('toTheFirstPage')}
            </SheetAction>
          ),
        };
      case 'not-read':
        return {
          note: saying(t('offersNotRead')),
          holds: (
            <SheetAction kind="board" address={addressOf(page)} testId="try-again">
              {t('tryAgain')}
            </SheetAction>
          ),
        };
    }
  })();

  return (
    <section
      id="offers"
      aria-labelledby="offers-title"
      className="grid scroll-mt-4 justify-items-center pt-section-phone md:pt-section"
    >
      <Sheet print="in-view">
        <SheetTitle id="offers-title">
          {t('offersTitle', { count, countText: formatNumber(count) })}
        </SheetTitle>
        {note}
        {holds}
      </Sheet>
    </section>
  );
}

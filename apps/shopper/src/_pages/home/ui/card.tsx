import type { PlatformFiguresResponse, VisiblePartResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { getLocale, getTranslations } from 'next-intl/server';

import { partAddress } from '@/entities/part';
import { photographs } from '@/shared/photographs';
import { ShownPrice } from '@/shared/price';
import { buttonVariants, DimPhotograph } from '@/shared/ui';
import { NameSlot, Switches } from '@/widgets/frame-header';

// The card over a dim room (DESIGN.md's The card over a dim room): the home
// page's whole first screen, a full-bleed photograph of a red-lit motherboard
// dimmed to 62%, at least a screen tall, and centred on it one panel of
// Sheet Paper. Along its top, the frame's row, which is the home page's
// header; then the three words of the title spread to the start, the middle
// and the end, over a perforation; then the facts at the start and one
// sentence at the end; along its foot, the photograph's caption, Choose a
// Category and the plate's Part with its Lowest Price as a link. On a phone
// the words wrap at the start and the button comes first in the foot. It
// does not move. The card's top row is the page's header, so the room above
// the card clears a phone's notch, as the stub's padding does.
//
// Each fact is true and comes from the data or the platform's rules: the
// eight Categories always, and a count only where the API answered it.
export async function Card({
  part,
  figures,
}: {
  part: VisiblePartResponse | undefined;
  figures: PlatformFiguresResponse | undefined;
}) {
  const [language, t] = await Promise.all([getLocale(), getTranslations('HomePage')]);

  return (
    <section
      aria-labelledby="home-title"
      className="page-margins relative isolate grid min-h-svh place-items-center pt-[max(2.5rem,env(safe-area-inset-top))] pb-10"
    >
      <DimPhotograph photograph={photographs.redLitMotherboard} dimmedTo={62} first />
      {/* A word wider than the card, as a Kurdish one is at a phone's
          largest text, breaks where it must rather than widen the card past
          the window, as a sheet's title does. */}
      <div
        data-testid="card"
        className="grid min-h-[70svh] w-full max-w-[52rem] grid-rows-[auto_auto_1fr_auto] gap-7 bg-card p-5 text-card-foreground wrap-anywhere md:min-h-[62svh] md:p-8"
      >
        <header
          data-testid="frame-header"
          className="flex flex-col items-start gap-x-6 md:flex-row md:flex-wrap md:items-center md:justify-between"
        >
          <NameSlot onTheHomePage />
          <Switches />
        </header>

        <h1
          id="home-title"
          className="type-display perforated-below flex flex-wrap gap-x-[0.3em] pb-5 md:justify-between"
        >
          <span>{t('titleWords.parts')}</span> <span>{t('titleWords.prices')}</span>{' '}
          <span>{t('titleWords.vendors')}</span>
        </h1>

        <div className="grid content-start gap-6 md:grid-cols-[auto_minmax(0,30ch)] md:justify-between">
          <ul data-testid="card-facts" className="type-facts grid content-start">
            <li>{t('eightCategories')}</li>
            {figures !== undefined && (
              <li data-testid="card-vendors-and-offers">
                {t('vendorsAndOffers', {
                  vendors: figures.activeVendorCount,
                  vendorsText: formatNumber(figures.activeVendorCount),
                  offers: figures.visibleOfferCount,
                  offersText: formatNumber(figures.visibleOfferCount),
                })}
              </li>
            )}
            {figures !== undefined && (
              <li data-testid="card-confirmed-within">
                {t('confirmedWithin', {
                  days: figures.daysAnOfferStaysCurrent,
                  daysText: formatNumber(figures.daysAnOfferStaysCurrent),
                })}
              </li>
            )}
          </ul>
          <p className="text-lg">{t('lede')}</p>
        </div>

        <div className="grid items-end gap-4 md:grid-cols-[1fr_auto_1fr]">
          <p className="order-2 text-sm text-muted-foreground md:order-none">
            {t('roomCaption')}
          </p>
          <a
            href="#categories"
            className={buttonVariants({
              kind: 'primary',
              className: 'order-first md:order-none',
            })}
          >
            {t('chooseACategory')}
          </a>
          {part !== undefined && (
            <a
              data-testid="card-part"
              href={partAddress(language, part.id)}
              className="hover-underline order-3 inline-flex min-h-control flex-wrap items-center gap-x-1.5 text-sm md:justify-self-end md:justify-end md:text-end"
            >
              <AlwaysEnglish>{part.name}</AlwaysEnglish>
              {part.lowestPrice !== null && <ShownPrice price={part.lowestPrice} />}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

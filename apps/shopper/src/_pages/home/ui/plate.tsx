import type {
  PlatformFiguresResponse,
  VisibleOfferResponse,
  VisiblePartResponse,
} from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { getLocale, getTranslations } from 'next-intl/server';

import { categoryAddress } from '@/entities/category';
import { PartPicture, partAddress, PriceSlip } from '@/entities/part';
import { chosenCurrency, currencies, currencyMarks } from '@/shared/currency';
import { buttonVariants } from '@/shared/ui';
import { CurrencySwitch } from '@/widgets/frame-header';

// One Part, on the plate (DESIGN.md's The square plate): a field of the Board
// split in half, at least 88% of a screen tall. On the start side one square,
// the Part's photo or its Category's icon, 40 pixels in from the field's
// edges, the notch cut into its end edge; on the end side a column with, at
// its top, the currency as tabs, the same choice as the frame's switch,
// standing above the price it leads; in its middle the title and the Part's
// price slip; at its foot two cells side by side, 72 pixels tall, the first
// of Ink and the second of Sheet Paper, to the Part's page and its
// Category's. On a phone it stacks, the photograph first, its cells one
// above the other. A word wider than its column, as at a phone's largest
// text, breaks where it must rather than widen the plate past the window.
export async function Plate({
  part,
  offers,
  figures,
}: {
  part: VisiblePartResponse;
  offers: readonly VisibleOfferResponse[] | undefined;
  figures: PlatformFiguresResponse | undefined;
}) {
  const [language, currency, t, frame, categoryName] = await Promise.all([
    getLocale(),
    chosenCurrency(),
    getTranslations('HomePage'),
    getTranslations('Frame'),
    getTranslations('Category'),
  ]);
  const count = { count: part.vendorCount, countText: formatNumber(part.vendorCount) };

  return (
    <section
      aria-labelledby="plate-title"
      data-testid="plate"
      data-part={part.id}
      className="grid min-h-[88svh] bg-secondary text-secondary-foreground wrap-anywhere md:grid-cols-2"
    >
      <div className="grid items-center p-4 md:p-10">
        <PartPicture part={part} sizes="(min-width: 48rem) 50vw, 100vw" />
      </div>
      <div className="flex flex-col justify-between gap-8 p-4 md:p-10">
        <CurrencySwitch
          language={language}
          current={currency}
          label={frame('currencySwitch')}
          look="tabs"
          testId="plate-tabs"
          choices={currencies.map((each) => ({
            currency: each,
            name: frame(`currencies.${each}`),
            mark: currencyMarks[each],
          }))}
        />
        <div className="grid justify-items-start gap-6">
          <h2 id="plate-title" className="type-sheet-title">
            {t('plate.title', count)}
          </h2>
          {offers !== undefined && (
            <PriceSlip
              partName={part.name}
              offers={offers}
              iqdPerUsd={figures?.iqdPerUsd}
              onThePlate
            />
          )}
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <a
            href={partAddress(language, part.id)}
            className={buttonVariants({
              kind: 'ink',
              className: 'min-h-plate-cell-phone md:min-h-plate-cell',
            })}
          >
            {t('plate.seeItsOffers', count)}
          </a>
          <a
            href={categoryAddress(language, part.category)}
            className={buttonVariants({
              kind: 'paper',
              className: 'min-h-plate-cell-phone md:min-h-plate-cell',
            })}
          >
            {categoryName(part.category)}
          </a>
        </div>
      </div>
    </section>
  );
}

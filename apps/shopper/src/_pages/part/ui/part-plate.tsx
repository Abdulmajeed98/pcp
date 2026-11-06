import type {
  VisibleOfferResponse,
  VisiblePartWithSpecificationsResponse,
} from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { cn } from 'cn';
import { getLocale, getTranslations } from 'next-intl/server';
import { Fragment } from 'react';

import { categoryAddress } from '@/entities/category';
import { nameType, PartPicture, slipOf } from '@/entities/part';
import { chosenCurrency, currencies, currencyMarks } from '@/shared/currency';
import { ShownPrice } from '@/shared/price';
import { buttonVariants } from '@/shared/ui';
import { CurrencySwitch } from '@/widgets/frame-header';

// A Part page's square plate (DESIGN.md's A Part page and The square
// plate), the page's first piece: a field of the Board split in half, at
// least 88% of a screen tall. On the start side the Part's photo, or its
// Category's icon in its place (CAT-6), 40 pixels in from the field's edges,
// the notch cut into its end edge. On the end side a column with, at its
// top, the currency as tabs, the same choice as the frame's switch, standing
// above the price it leads; in its middle the Part's name as the page's
// `h1`, its manufacturer and its Category, named in the page's language and
// leading back to its Category page, its part numbers, and its Lowest Price;
// at its foot two cells side by side, the first of Ink leading down to its
// Offers, the second of Sheet Paper to its Category's page. The name, the
// manufacturer and the part numbers are English in every language (LANG-3),
// the part numbers one left-to-right list, as a box prints them.
// On a phone it stacks, its words first and the photograph after them, its
// cells one above the other.
export async function PartPlate({
  part,
  offers,
}: {
  part: VisiblePartWithSpecificationsResponse;
  offers: readonly VisibleOfferResponse[];
}) {
  const [language, currency, t, frame, categoryName] = await Promise.all([
    getLocale(),
    chosenCurrency(),
    getTranslations('PartPage'),
    getTranslations('Frame'),
    getTranslations('Category'),
  ]);
  const { lowest } = slipOf(offers);
  const vendors = { count: offers.length, countText: formatNumber(offers.length) };
  // The cells hold their words on one line beside each other in half the
  // plate at 768 pixels, so they take a cell's narrower padding.
  const cell = 'min-h-plate-cell-phone px-4 md:min-h-plate-cell';

  return (
    <section
      aria-labelledby="part-name"
      data-testid="part-plate"
      className="grid min-h-[88svh] bg-secondary text-secondary-foreground md:grid-cols-2"
    >
      <div className="flex min-w-0 flex-col justify-between gap-8 p-4 md:col-start-2 md:row-start-1 md:p-10">
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
        <div className="grid justify-items-start gap-4">
          <h1
            id="part-name"
            lang="en"
            className={cn('max-w-full wrap-break-word', nameType(part.name))}
          >
            <AlwaysEnglish>{part.name}</AlwaysEnglish>
          </h1>
          <p className="text-lg">
            <AlwaysEnglish data-testid="manufacturer">{part.manufacturer}</AlwaysEnglish>
            {' · '}
            <a
              href={categoryAddress(language, part.category)}
              data-testid="category"
              className="hover-underline"
            >
              {categoryName(part.category)}
            </a>
          </p>
          {part.partNumbers.length > 0 && (
            <p data-testid="part-numbers" className="max-w-full wrap-break-word">
              <span className="text-muted-foreground">
                {t('partNumbers', { count: part.partNumbers.length })}
              </span>{' '}
              <AlwaysEnglish>
                {part.partNumbers.map((number, place) => (
                  <Fragment key={number}>
                    {place > 0 && ', '}
                    <span data-testid="part-number">{number}</span>
                  </Fragment>
                ))}
              </AlwaysEnglish>
            </p>
          )}
          <p data-testid="plate-lowest" className="text-xl font-semibold">
            {t('lowestPrice')}{' '}
            {lowest?.shownPrice ? (
              <ShownPrice price={lowest.shownPrice} />
            ) : (
              <span className="font-normal text-muted-foreground">
                {t('outOfStockEverywhere')}
              </span>
            )}
          </p>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <a
            href="#offers"
            data-testid="to-the-offers"
            className={buttonVariants({ kind: 'ink', className: cell })}
          >
            {t('offersTitle', vendors)}
          </a>
          <a
            href={categoryAddress(language, part.category)}
            className={buttonVariants({ kind: 'paper', className: cell })}
          >
            {categoryName(part.category)}
          </a>
        </div>
      </div>
      <div className="grid items-center p-4 md:col-start-1 md:row-start-1 md:p-10">
        <PartPicture part={part} sizes="(min-width: 48rem) 50vw, 100vw" first />
      </div>
    </section>
  );
}

import type { VisibleOfferResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish, AsWritten } from '@pcp/ui';
import { cn } from 'cn';
import { getLocale, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { currencyMarks } from '@/shared/currency';
import { confirmationIn } from '@/shared/offer-words';
import { ShownPrice } from '@/shared/price';
import { PrintInView, Stamp } from '@/shared/ui';

import { slipOf } from '../model/slip';

// The price slip (DESIGN.md's The price slip): a Part's figures as a till
// slip, Sheet Paper, or the Bone Ground on the home page's plate, 23rem
// wide, its foot torn. The name slot's words head it, then the Part's name,
// a dashed rule, then its lines joined by dotted leaders: the Lowest Price in
// the Title size, the highest in stock, how many Vendors, how many in stock,
// how many converted "≈", the Platform Rate; a dashed rule; and a foot in
// Small Soft Ink with the day the lowest was confirmed and its Vendor's name
// as written. The Lowest Price is stamped on it in the green ink.
//
// Each figure is the API's: a line whose figure the API did not answer is
// left out, as the rate is before the Admin sets the first. A Part every
// Vendor has out of stock has no Lowest Price, and says so in its place.
//
// It is printed below the first screen, so the page's script feeds it as it
// comes into view, as a till feeds its slip (Motion 4), and the stamp lands
// once it has printed (Motion 3). Beside a Part's Offers it is `pinned` from
// 64rem: it holds its place 32 pixels from the top while they scroll past,
// and lets go where they end (Motion 7), which the page's own scrolling
// does, nothing hijacked; below 64rem it scrolls with them.
export async function PriceSlip({
  partName,
  offers,
  iqdPerUsd,
  onThePlate = false,
  pinned = false,
}: {
  partName: string;
  offers: readonly VisibleOfferResponse[];
  iqdPerUsd: number | null | undefined;
  onThePlate?: boolean;
  pinned?: boolean;
}) {
  const [language, t, site] = await Promise.all([
    getLocale(),
    getTranslations('PriceSlip'),
    getTranslations('Site'),
  ]);
  const slip = slipOf(offers);
  const rule =
    'border-b-2 border-dashed border-[color-mix(in_srgb,var(--foreground)_45%,transparent)]';

  return (
    <PrintInView
      frameClassName={cn(
        'w-full max-w-[23rem]',
        pinned && 'lg:sticky lg:top-8 lg:self-start',
      )}
      testId="price-slip"
      className={cn(
        'feeds torn-foot figures relative overflow-clip px-4 pt-[26px] pb-24 md:px-6',
        onThePlate ? 'bg-background text-foreground' : 'bg-card text-card-foreground',
      )}
    >
      <div>
        <p className="type-label text-center">{site('name')}</p>
        <p className={cn('mt-1 pb-3.5 text-center', rule)}>
          <AlwaysEnglish>{partName}</AlwaysEnglish>
        </p>
        <ul className={cn('@container grid grid-cols-[minmax(0,1fr)] gap-2.5 py-4', rule)}>
          <Line name={t('lowestPrice')} testId="slip-lowest">
            {slip.lowest?.shownPrice ? (
              <ShownPrice price={slip.lowest.shownPrice} className="text-xl" />
            ) : (
              <span className="font-normal text-muted-foreground">
                {t('outOfStockEverywhere')}
              </span>
            )}
          </Line>
          {slip.highestInStock !== undefined && (
            <Line name={t('highestInStock')} testId="slip-highest">
              <ShownPrice price={slip.highestInStock} />
            </Line>
          )}
          <Line name={t('vendors')} testId="slip-vendors">
            {formatNumber(slip.vendors)}
          </Line>
          <Line name={t('inStock')} testId="slip-in-stock">
            {formatNumber(slip.inStock)}
          </Line>
          <Line name={t('converted')} testId="slip-converted">
            {formatNumber(slip.converted)}
          </Line>
          {iqdPerUsd !== null && iqdPerUsd !== undefined && (
            <Line name={t('rate')} testId="slip-rate">
              <AlwaysEnglish>
                {formatNumber(iqdPerUsd)} {currencyMarks.IQD} = 1 {currencyMarks.USD}
              </AlwaysEnglish>
            </Line>
          )}
        </ul>
        {slip.lowest !== undefined && (
          <p
            data-testid="slip-foot"
            className="pt-3.5 text-center text-sm text-muted-foreground"
          >
            {confirmationIn(language, slip.lowest.daysSinceConfirmation)} ·{' '}
            <AsWritten>{slip.lowest.vendor.name}</AsWritten>
          </p>
        )}
      </div>
      {slip.lowest !== undefined && (
        <Stamp className="end-5 bottom-[34px] [--stamp-at:1150ms]">{t('stamp')}</Stamp>
      )}
    </PrintInView>
  );
}

// One line of the slip: its name at the start, a dotted leader, and its
// figure at the end, at weight 600. On a slip too narrow for its own text,
// as with a phone's text made larger, its name takes the whole line and the
// leader runs to the figure on the next (the theme's `data-slip-line` rule,
// break-ui, browse ticket 12).
function Line({
  name,
  testId,
  children,
}: {
  name: string;
  testId: string;
  children: ReactNode;
}) {
  return (
    <li
      data-testid={testId}
      data-slip-line=""
      className="grid grid-cols-[minmax(0,max-content)_minmax(0.5rem,1fr)_auto] items-end gap-2 md:grid-cols-[max-content_minmax(1rem,1fr)_auto]"
    >
      <span>{name}</span>
      <span aria-hidden="true" className="leader" />
      <b className="font-semibold">{children}</b>
    </li>
  );
}

import type { PlatformFiguresResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import type { ReactNode } from 'react';

import { currencyMarks } from '@/shared/currency';
import { photographs } from '@/shared/photographs';

// The facts row (DESIGN.md's The facts row): a heading at Display size in
// columns 1 to 6 and a sentence in columns 9 to 12, its last line on the
// heading's baseline; 120 pixels below, four facts spread across the row,
// each a figure in the Facts size with one line under it in Small Soft Ink;
// a photograph at 4:3 under its end half, with its caption. On a phone the
// facts take two columns.
//
// Each fact is true and comes from the platform's own figures, as the API
// answers them (`GET v1/platform-figures`): how many active Vendors and
// Visible Offers it holds, the Platform Rate behind every "≈", and how many
// days an Offer stays current without a Confirmation. A fact the API did not
// answer is left out, as the rate is before the Admin sets the first.
export async function FactsRow({
  figures,
}: {
  figures: PlatformFiguresResponse | undefined;
}) {
  const t = await getTranslations('HomePage.facts');

  return (
    <section
      aria-labelledby="facts-title"
      className="page-margins pt-[8.75rem] pb-section-phone md:pb-section"
    >
      <div className="grid gap-6 md:grid-cols-12 md:items-end">
        <h2 id="facts-title" className="type-display md:col-span-6">
          {t('heading')}
        </h2>
        <p className="max-w-[70ch] md:col-span-4 md:col-start-9">{t('note')}</p>
      </div>

      {figures !== undefined && (
        <ul
          data-testid="facts"
          className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 md:mt-[7.5rem] md:flex md:flex-wrap md:justify-between md:gap-6"
        >
          <Fact
            testId="fact-vendors"
            line={t('vendors', { count: figures.activeVendorCount })}
          >
            <AlwaysEnglish className="type-facts">
              {formatNumber(figures.activeVendorCount)}
            </AlwaysEnglish>
          </Fact>
          <Fact
            testId="fact-offers"
            line={t('offers', { count: figures.visibleOfferCount })}
          >
            <AlwaysEnglish className="type-facts">
              {formatNumber(figures.visibleOfferCount)}
            </AlwaysEnglish>
          </Fact>
          {figures.iqdPerUsd !== null && (
            <Fact testId="fact-rate" line={t('rate')}>
              <AlwaysEnglish className="type-facts">
                {formatNumber(figures.iqdPerUsd)} {currencyMarks.IQD}
              </AlwaysEnglish>
            </Fact>
          )}
          <Fact testId="fact-days" line={t('daysLine')}>
            <span className="type-facts">
              {t('days', {
                days: figures.daysAnOfferStaysCurrent,
                daysText: formatNumber(figures.daysAnOfferStaysCurrent),
              })}
            </span>
          </Fact>
        </ul>
      )}

      <figure className="mt-10 md:ms-auto md:mt-16 md:w-[41.6%]">
        <div className="relative aspect-[4/3] bg-secondary">
          <Image
            src={photographs.caseConnectors.image}
            alt=""
            fill
            sizes="(min-width: 48rem) 42vw, 100vw"
            className="object-cover"
          />
        </div>
        <figcaption className="pt-2 text-sm text-muted-foreground">
          {t('photoCaption')}
        </figcaption>
      </figure>
    </section>
  );
}

// One fact: its figure, and its one line under it.
function Fact({
  testId,
  line,
  children,
}: {
  testId: string;
  line: string;
  children: ReactNode;
}) {
  return (
    <li data-testid={testId} className="grid content-start gap-1">
      <b className="figures block font-[inherit]">{children}</b>
      <span className="text-sm text-muted-foreground">{line}</span>
    </li>
  );
}

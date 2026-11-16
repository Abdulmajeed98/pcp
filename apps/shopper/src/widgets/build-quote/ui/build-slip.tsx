import type { BuildResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { cn } from 'cn';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { partsCountedIn } from '@/entities/build';
import { ShownPrice } from '@/shared/price';
import { Stamp } from '@/shared/ui';

import { outcomeCountsOf, powerDrawOf } from '../model/findings';

// The Build's till slip (DESIGN.md's The Build's till slip): the price slip
// of a Part page, the same paper, width, torn foot and rules, carrying the
// Build's figures: the name slot's words as its heading in a Label, then
// "Your Build · 8 Parts", a dashed rule, then its lines joined by dotted
// leaders: the Lowest total in the Title size, the first price view's total
// and the page's headline (BLD-7), "≈" when any of its prices is converted
// and "—" when no Part has a Lowest Price; the Vendors to visit, how many
// Vendors the Lowest Prices come from; the Parts; whether it is complete;
// and, once it holds a Part, the Problems, the Warnings and the rules not
// checked, the rules passed, and the Estimated power draw, "—" when it is
// not known and left out without a CPU. Below 64rem, where it comes first,
// it carries its price lines alone, from the Lowest total to Complete, and
// leaves the rules' counts and the power draw to the rules' sheet, which
// says them too, so that a phone's first screen holds the slip and the
// Build's title (the owner, 13 November 2026). Then a dashed rule, and at its foot,
// in Small Soft Ink, that each Part is at its Lowest Price, read just now,
// with, when it holds any, that the total leaves out the Parts no Vendor has
// in stock, and the Parts whose price cannot be shown yet (PRC-5). No
// Shopper code adds a price: the total is the API's. The stamp "Complete
// Build" lands on it when the Build is a Complete Build with no
// Compatibility Problem, and only then.
//
// It comes first on a phone, so that the first screen holds the total, and
// is pinned from 64rem beside the Build's sheet, holding its
// place 32 pixels from the top while the sheet scrolls past (Motion 7). It is
// on the first screen, so it prints as the page opens (Motion 1). Each figure
// a change in place may alter is named for the page's script, which settles
// it again (Motion 11), and so is the space of its lines and of its foot.
export async function BuildSlip({
  answer,
  stamped,
}: {
  answer: BuildResponse;
  stamped: boolean;
}) {
  const [t, site] = await Promise.all([
    getTranslations('BuildPage'),
    getTranslations('Site'),
  ]);
  const rule =
    'border-b-2 border-dashed border-[color-mix(in_srgb,var(--foreground)_45%,transparent)]';
  const parts = partsCountedIn(answer.parts);
  const stillNeeded = answer.stillNeeded.length;
  const vendorsToVisit = new Set(
    answer.parts.flatMap(({ lowestPrice }) =>
      lowestPrice === null ? [] : [lowestPrice.vendor.id],
    ),
  ).size;
  const counts = outcomeCountsOf(answer.outcomes);
  const count = (outcome: keyof typeof counts) => formatNumber(counts[outcome]);
  const power = powerDrawOf(answer);
  const unstocked = answer.parts.filter((part) => part.unstocked).length;
  const priceNotShown = answer.parts.filter((part) => part.priceNotShown).length;

  return (
    <div className="w-full max-w-[23rem] lg:sticky lg:top-8 lg:self-start">
      <div
        data-testid="build-slip"
        className="print-on-arrival torn-foot figures relative overflow-clip bg-card px-4 pt-[26px] pb-24 text-card-foreground md:px-6"
      >
        <p className="type-label text-center">{site('name')}</p>
        <p data-testid="slip-heading" className={`mt-1 pb-3.5 text-center ${rule}`}>
          {t('slip.yourBuild', { count: parts, countText: formatNumber(parts) })}
        </p>
        <ul
          data-space="slip"
          className={`@container grid grid-cols-[minmax(0,1fr)] gap-2.5 py-4 ${rule}`}
        >
          <Line name={t('slip.lowestTotal')} figure="total">
            {answer.totalAcrossVendors === null ? (
              '—'
            ) : (
              <ShownPrice price={answer.totalAcrossVendors} className="text-xl" />
            )}
          </Line>
          <Line name={t('slip.vendorsToVisit')} figure="vendors">
            {formatNumber(vendorsToVisit)}
          </Line>
          <Line name={t('slip.parts')} figure="parts">
            {formatNumber(parts)}
          </Line>
          <Line name={t('slip.complete')} figure="complete">
            {answer.complete
              ? t('slip.yes')
              : t('slip.stillNeeded', {
                  count: stillNeeded,
                  countText: formatNumber(stillNeeded),
                })}
          </Line>
          {answer.parts.length > 0 && (
            <>
              <Line name={t('slip.problems')} figure="problems" fromTheDesk>
                {count('problem')}
              </Line>
              <Line name={t('slip.warnings')} figure="warnings" fromTheDesk>
                {count('warning')}
              </Line>
              <Line name={t('slip.notChecked')} figure="unchecked" fromTheDesk>
                {count('unchecked')}
              </Line>
              <Line name={t('slip.rulesPassed')} figure="passed" fromTheDesk>
                {count('passes')}
              </Line>
              {power !== undefined && (
                <Line name={t('slip.powerDraw')} figure="power" fromTheDesk>
                  {'watts' in power ? <AlwaysEnglish>{power.watts}</AlwaysEnglish> : '—'}
                </Line>
              )}
            </>
          )}
        </ul>
        <div
          data-space="slip-foot"
          className="grid grid-cols-[minmax(0,1fr)] gap-3 pt-3.5 text-center text-sm text-muted-foreground"
        >
          {unstocked > 0 && (
            <p data-testid="slip-leaves-out">
              {t('slip.leavesOut', {
                count: unstocked,
                countText: formatNumber(unstocked),
              })}
            </p>
          )}
          {priceNotShown > 0 && (
            <p data-testid="slip-price-not-shown">
              {t('slip.priceNotShown', {
                count: priceNotShown,
                countText: formatNumber(priceNotShown),
              })}
            </p>
          )}
          <p>{t('slip.foot')}</p>
        </div>
        {stamped && (
          <Stamp
            className="end-5 bottom-[34px] [--stamp-at:1150ms]"
            data={{ 'data-line': 'stamp' }}
          >
            {t('stamp')}
          </Stamp>
        )}
      </div>
    </div>
  );
}

// One line of the slip, as a Part page's slip draws it: its name at the
// start, a dotted leader, and its figure at the end, at weight 600. On a slip
// too narrow for its own text its name takes the whole line, and the leader
// runs to the figure on the next (the theme's `data-slip-line` rule). From
// 48rem it is a row that wraps, as a Part page's slip's line is, so that a
// line that cannot hold its name and its figure side by side stacks alone
// (follow-up ticket 11). A line drawn only `fromTheDesk` is left out below
// 64rem, and is that row from there.
function Line({
  name,
  figure,
  fromTheDesk = false,
  children,
}: {
  name: string;
  figure: string;
  fromTheDesk?: boolean;
  children: ReactNode;
}) {
  return (
    <li
      data-testid={`slip-${figure}`}
      data-slip-line=""
      className={cn(
        'grid grid-cols-[minmax(0,max-content)_minmax(0.5rem,1fr)_auto] items-end gap-2 md:flex-wrap md:gap-x-2 md:gap-y-1',
        fromTheDesk ? 'max-lg:hidden lg:flex' : 'md:flex',
      )}
    >
      <span className="md:shrink-0">{name}</span>
      <span className="contents md:flex md:grow md:items-end md:gap-2">
        <span aria-hidden="true" className="leader md:min-w-4 md:grow" />
        <b data-figure={figure} className="font-semibold">
          {children}
        </b>
      </span>
    </li>
  );
}

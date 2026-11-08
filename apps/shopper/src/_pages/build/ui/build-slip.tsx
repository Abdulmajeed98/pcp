import { formatNumber } from '@pcp/i18n';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { Stamp } from '@/shared/ui';

// The Build's till slip (DESIGN.md's The Build's till slip): the price slip
// of a Part page, the same paper, width, torn foot and rules, carrying the
// Build's figures: the name slot's words as its heading in a Label, then
// "Your Build · 8 Parts", a dashed rule, then its lines joined by dotted
// leaders, the Parts and whether it is complete; ticket 08 of the builder
// module adds the Lowest total, the Vendors to visit, the rules' counts and
// the power draw. The stamp "Complete Build" lands on it when the Build is a
// Complete Build with no Compatibility Problem, and only then.
//
// It comes first on a phone, so that the first screen holds the status, and
// is pinned from 64rem beside the Build's sheet, holding its place 32 pixels
// from the top while the sheet scrolls past (Motion 7). It is on the first
// screen, so it prints as the page opens (Motion 1). Each figure a change in
// place may alter is named for the page's script, which settles it again
// (Motion 11).
export async function BuildSlip({
  parts,
  complete,
  stillNeeded,
  stamped,
}: {
  parts: number;
  complete: boolean;
  stillNeeded: number;
  stamped: boolean;
}) {
  const [t, site] = await Promise.all([
    getTranslations('BuildPage'),
    getTranslations('Site'),
  ]);
  const rule =
    'border-b-2 border-dashed border-[color-mix(in_srgb,var(--foreground)_45%,transparent)]';

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
          <Line name={t('slip.parts')} figure="parts">
            {formatNumber(parts)}
          </Line>
          <Line name={t('slip.complete')} figure="complete">
            {complete
              ? t('slip.yes')
              : t('slip.stillNeeded', {
                  count: stillNeeded,
                  countText: formatNumber(stillNeeded),
                })}
          </Line>
        </ul>
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
// runs to the figure on the next (the theme's `data-slip-line` rule).
function Line({
  name,
  figure,
  children,
}: {
  name: string;
  figure: string;
  children: ReactNode;
}) {
  return (
    <li
      data-testid={`slip-${figure}`}
      data-slip-line=""
      className="grid grid-cols-[minmax(0,max-content)_minmax(0.5rem,1fr)_auto] items-end gap-2 md:grid-cols-[max-content_minmax(1rem,1fr)_auto]"
    >
      <span>{name}</span>
      <span aria-hidden="true" className="leader" />
      <b data-figure={figure} className="font-semibold">
        {children}
      </b>
    </li>
  );
}

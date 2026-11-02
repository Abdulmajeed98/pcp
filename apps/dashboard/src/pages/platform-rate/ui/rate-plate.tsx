import type { CurrentPlatformRateResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { Fragment } from 'react';

import { ChangingInPlace, Plate } from '@/shared/ui';

// The day a rate was set, in English, with Western digits, in the Admin's
// own time zone, as a Part's page writes the day it last changed.
const day = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'long',
  numberingSystem: 'latn',
});

// The Platform Rate on the screen's one leading plate, as the dashboard's
// DESIGN.md gives it: "1 $ = 1,575 IQD", the figures in Plate Amber and the
// units and the equals sign in Plate Unit, drawn left to right and named as
// one image with its words, "1 dollar is 1,575 dinars", which are read
// while the drawn figures are hidden from a reader; and beside it, or
// below it on a phone, the day the Admin set it, "Set 2 November 2026".
// A new rate takes its place as Motion 10 says: the old figure and day fade
// under the new, and their width follows, through `ChangingInPlace`.
export function RatePlate({ rate }: { rate: CurrentPlatformRateResponse }) {
  const figure = formatNumber(rate.iqdPerUsd);
  const setOn = day.format(new Date(rate.setAt));

  return (
    <p className="flex flex-col items-start gap-x-3 gap-y-2 sm:flex-row sm:items-center">
      <Plate lead data-testid="platform-rate-plate" className="max-w-full">
        <span data-testid="platform-rate-words" className="sr-only">
          1 dollar is {figure} dinars
        </span>
        <AlwaysEnglish
          data-testid="platform-rate-drawn"
          aria-hidden="true"
          className="whitespace-nowrap"
        >
          1 <Unit>$</Unit> <Unit>=</Unit>{' '}
          <ChangingInPlace inline axis="width" changeKey={figure} data-testid="rate-figure">
            <Figure figure={figure} />
          </ChangingInPlace>{' '}
          <Unit>IQD</Unit>
        </AlwaysEnglish>
      </Plate>
      <ChangingInPlace
        inline
        axis="width"
        changeKey={setOn}
        data-testid="platform-rate-set-on"
        className="text-sm text-muted-foreground"
      >
        Set {setOn}
      </ChangingInPlace>
    </p>
  );
}

// A unit after a figure, or the equals sign between them: smaller, in Geist
// and in Plate Unit.
function Unit({ children }: { children: string }) {
  return <span className="font-sans text-sm font-medium text-plate-unit">{children}</span>;
}

// A figure in Geist Mono, its grouping commas set in Geist, so that a comma
// takes no whole cell of the figure, as on every plate (redesign ticket 12).
function Figure({ figure }: { figure: string }) {
  return (
    <>
      {figure.split(/(,)/).map((piece, index) => (
        <Fragment key={index}>
          {piece === ',' ? <span className="font-sans">{piece}</span> : piece}
        </Fragment>
      ))}
    </>
  );
}

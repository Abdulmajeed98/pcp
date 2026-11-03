import type { CurrentPlatformRateResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { ArrowRightLeftIcon } from 'lucide-react';
import { useState } from 'react';

import { WhyNotAnswered } from '@/shared/api';
import { dayWritten } from '@/shared/lib';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  ChangingInPlace,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  ScreenTitle,
} from '@/shared/ui';

import { usePlatformRate, useSetPlatformRate } from '../api/platform-rate';
import { RateBoard, RateBoardSketch } from './rate-board';
import { RateForm } from './rate-form';

// The Admin console's Platform Rate (PRC-1): the single number of IQD per
// USD that every Converted Price follows, which the Admin sets by hand to
// follow the Erbil market rate (ADR-0002). The Admin console is in English
// only, so its text is written here.
//
// As the dashboard's DESIGN.md lays it out, the changer's board the owner
// chose on 2 November 2026: under the title, a Raised Stone field holding
// the board, the day it was set and one Note Grey sentence, or, until the
// first rate is set, the empty state in the board's place; beside the field
// from 64rem, and below it on a phone, the form for a new rate. A saved rate
// is written into the rate's query, so the board flips to it at once
// (Motion 10), and the field's height follows where the empty state gives
// way to the board. The field is a size container: the board is drawn as
// large as the room the field has (`rate-board.tsx`), not as the window's
// width would have it.
export function PlatformRatePage() {
  const rate = usePlatformRate();
  const setRate = useSetPlatformRate();
  // What a reader is told once a rate is saved.
  const [saved, setSaved] = useState('');

  const current = rate.data?.current;
  const state = rate.error
    ? 'not-read'
    : rate.data === undefined
      ? 'reading'
      : current === null || current === undefined
        ? 'none'
        : 'rate';

  return (
    <div className="flex min-w-0 flex-col gap-4 lg:gap-6">
      <ScreenTitle className="screen-title">Platform Rate</ScreenTitle>
      <div className="grid gap-6 lg:min-h-[calc(100dvh-10.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:gap-8">
        <section
          aria-label="The current Platform Rate"
          className="@container flex flex-col justify-center rounded-card bg-secondary px-4 py-6 lg:px-8 lg:py-12"
        >
          <ChangingInPlace axis="height" changeKey={state}>
            {state === 'rate' && current ? (
              <Board current={current} />
            ) : state === 'none' ? (
              <NoPlatformRate />
            ) : state === 'not-read' && rate.error ? (
              <Alert variant="destructive" data-testid="not-read">
                <AlertTitle>The Platform Rate could not be read</AlertTitle>
                <AlertDescription>
                  <WhyNotAnswered error={rate.error} />
                </AlertDescription>
              </Alert>
            ) : (
              <Reading />
            )}
          </ChangingInPlace>
        </section>
        <RateForm
          save={async (iqdPerUsd) => {
            const answer = await setRate.mutateAsync(iqdPerUsd);
            setSaved(
              answer.current === null
                ? ''
                : `Platform Rate set: 1 dollar is ${formatNumber(answer.current.iqdPerUsd)} dinars.`,
            );
            return answer;
          }}
        />
      </div>
      <output className="sr-only">{saved}</output>
    </div>
  );
}

// The board, centred in its field, with the day it was set under it and the
// sentence on what it does. A new day fades in over the old as its width
// follows, as Confirm all's words change.
function Board({ current }: { current: CurrentPlatformRateResponse }) {
  const setOn = dayWritten(current.setAt);

  return (
    <div className="flex flex-col items-center gap-4 text-center lg:gap-5">
      <RateBoard iqdPerUsd={current.iqdPerUsd} />
      <ChangingInPlace
        inline
        axis="width"
        changeKey={setOn}
        data-testid="platform-rate-set-on"
        className="max-w-full text-muted-foreground"
      >
        {/* On one line, so that its width can follow a new day; in a field
            too narrow for it (the browser's text at 200% on a phone), on
            two. */}
        <span className="@max-[12.5rem]:whitespace-normal">
          Set <span className="font-semibold text-foreground">{setOn}</span>
        </span>
      </ChangingInPlace>
      <p className="max-w-[40ch] text-sm text-muted-foreground">
        Every Converted Price follows this rate. A price a Vendor quoted is never changed by
        it.
      </p>
    </div>
  );
}

// No Platform Rate yet: the dashboard's empty state, in the board's field,
// with what Shoppers see until one is set. Its action is the form beside it.
function NoPlatformRate() {
  return (
    <Empty data-testid="no-platform-rate" className="p-0">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ArrowRightLeftIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>No Platform Rate yet</EmptyTitle>
        <EmptyDescription>
          Until one is set, an Offer quoted in one currency is shown to Shoppers in that
          currency only.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

// While the rate is read: the board's place sketched, with a status for a
// reader.
function Reading() {
  return (
    <div className="flex flex-col items-center gap-4">
      <RateBoardSketch />
      <output className="sr-only">Reading the Platform Rate…</output>
    </div>
  );
}

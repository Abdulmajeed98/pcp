import { formatNumber } from '@pcp/i18n';
import { ArrowRightLeftIcon } from 'lucide-react';
import { useState } from 'react';

import { WhyNotAnswered } from '@/shared/api';
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
import { RateForm } from './rate-form';
import { RatePlate } from './rate-plate';

// The Admin console's Platform Rate (PRC-1): the single number of IQD per
// USD that every Converted Price follows, which the Admin sets by hand to
// follow the Erbil market rate (ADR-0002). The Admin console is in English
// only, so its text is written here.
//
// As the dashboard's DESIGN.md lays it out: under the title, the screen's
// one leading plate, "1 $ = 1,575 IQD", with the day it was set beside it
// and one Note Grey sentence on what it does; or, until the first rate is
// set, the empty state in the plate's place. Below either, the form for a
// new rate. A saved rate is written into the rate's query, so the plate
// shows it at once, and takes its place in the plate as Motion 10 says, the
// space below following where the empty state gives way to the plate.
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
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-4">
        <ScreenTitle className="screen-title">Platform Rate</ScreenTitle>
        <ChangingInPlace axis="height" changeKey={state}>
          {state === 'rate' && current ? (
            <div className="flex flex-col gap-4">
              <RatePlate rate={current} />
              <p className="text-sm text-muted-foreground">
                Every Converted Price follows this rate. A price a Vendor quoted is never
                changed by it.
              </p>
            </div>
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
      </div>
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
      <output className="sr-only">{saved}</output>
    </div>
  );
}

// No Platform Rate yet: the dashboard's empty state, between its Rule lines,
// with what Shoppers see until one is set. Its action is the form below it.
function NoPlatformRate() {
  return (
    <Empty data-testid="no-platform-rate" className="border-y border-rule">
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

// While the rate is read: the leading plate sketched in Raised Stone, still,
// as the dashboard's loading sketches are, with a status for a reader.
function Reading() {
  return (
    <div className="flex flex-col gap-4">
      <span
        aria-hidden="true"
        className="block h-13 w-56 rounded-plate-lead bg-secondary"
      />
      <output className="sr-only">Reading the Platform Rate…</output>
    </div>
  );
}

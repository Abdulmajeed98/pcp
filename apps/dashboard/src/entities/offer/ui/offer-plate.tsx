import type { OfferResponse } from '@pcp/api-client';
import { AlwaysEnglish } from '@pcp/ui';
import { Fragment } from 'react';

import { Trans } from '@/shared/i18n';
import { Plate } from '@/shared/ui';

import { iqdAmountWritten, usdAmountWritten } from '../model/prices';

// An Offer's prices on its one plate (DESIGN.md's Plates): the dollars before
// the dinars, 14 pixels apart, each figure followed by its unit as a quiet
// suffix, "169 $ 266,000 IQD"; on a screen too narrow for both, the dinars
// take a second line on the same plate, below 64rem only, as the table from
// 64rem gives the plate its width. The plate is drawn left to right in every
// language, and is named as one image with its words, "169 dollars, 266,000
// dinars", in the portal's language. An Offer out of stock has its plate
// muted, so that no one reads a price that cannot be bought as a live one.
export function OfferPlate({
  offer,
}: {
  offer: Pick<OfferResponse, 'usdPrice' | 'iqdPrice' | 'inStock'>;
}) {
  const usd = offer.usdPrice === null ? null : usdAmountWritten(offer.usdPrice);
  const iqd = offer.iqdPrice === null ? null : iqdAmountWritten(offer.iqdPrice);

  return (
    <Plate muted={!offer.inStock} className="max-w-full">
      <span className="sr-only">
        <Trans
          i18nKey={
            usd !== null && iqd !== null
              ? 'Offer.plateBoth'
              : usd !== null
                ? 'Offer.plateUsd'
                : 'Offer.plateIqd'
          }
          components={{ usd: <>{usd}</>, iqd: <>{iqd}</> }}
        />
      </span>
      <AlwaysEnglish
        aria-hidden="true"
        className="inline-flex flex-wrap items-baseline gap-x-3.5 gap-y-0.5 lg:flex-nowrap"
      >
        {usd !== null && <Price testId="usd-price" figure={usd} unit="$" />}
        {iqd !== null && <Price testId="iqd-price" figure={iqd} unit="IQD" />}
      </AlwaysEnglish>
    </Plate>
  );
}

// One price: its figure, then its unit after a space, the unit smaller and
// in Geist. The figure's grouping commas are set in Geist too, so that a
// comma does not take a whole cell of the figure: "266,000", never
// "266 , 000". Each price is English, left to right and kept apart from what
// is around it on its own, as the plate is (LANG-3, LANG-5).
function Price({ testId, figure, unit }: { testId: string; figure: string; unit: string }) {
  const groups = figure.split(',');

  return (
    <AlwaysEnglish data-testid={testId} className="whitespace-nowrap">
      {groups.map((group, index) => (
        <Fragment key={index}>
          {index > 0 && <span className="font-sans">,</span>}
          {group}
        </Fragment>
      ))}{' '}
      <span className="font-sans text-sm font-medium text-plate-unit group-data-[muted]/plate:text-plate-muted-figure">
        {unit}
      </span>
    </AlwaysEnglish>
  );
}

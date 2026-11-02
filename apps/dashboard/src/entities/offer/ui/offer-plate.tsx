import type { OfferResponse } from '@pcp/api-client';
import { AlwaysEnglish } from '@pcp/ui';

import { Trans } from '@/shared/i18n';
import { Plate, PlateFigure } from '@/shared/ui';

import { iqdAmountWritten, usdAmountWritten } from '../model/prices';

// An Offer's prices on its one plate (DESIGN.md's Plates): the dollars before
// the dinars, 14 pixels apart, each figure followed by its unit as a quiet
// suffix, "169 $ 266,000 IQD"; on a screen too narrow for both, the dinars
// take a second line on the same plate, below 64rem only, as the table from
// 64rem gives the plate its width. The plate is drawn left to right in every
// language, and is named as one image with its words, "169 dollars, 266,000
// dinars", in the portal's language. An Offer out of stock has its plate
// muted, so that no one reads a price that cannot be bought as a live one.
// On an Offer's own screen it is the screen's leading plate, `lead`.
export function OfferPlate({
  offer,
  lead = false,
}: {
  offer: Pick<OfferResponse, 'usdPrice' | 'iqdPrice' | 'inStock'>;
  lead?: boolean;
}) {
  const usd = offer.usdPrice === null ? null : usdAmountWritten(offer.usdPrice);
  const iqd = offer.iqdPrice === null ? null : iqdAmountWritten(offer.iqdPrice);

  return (
    <Plate muted={!offer.inStock} lead={lead} className="max-w-full">
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

// One price: its figure, its commas and point in Geist (`PlateFigure`), then
// its unit after a space, the unit smaller and in Geist. Each price is
// English, left to right and kept apart from what is around it on its own,
// as the plate is (LANG-3, LANG-5).
function Price({ testId, figure, unit }: { testId: string; figure: string; unit: string }) {
  return (
    <AlwaysEnglish data-testid={testId} className="whitespace-nowrap">
      <PlateFigure figure={figure} />{' '}
      <span className="font-sans text-sm font-medium text-plate-unit group-data-[muted]/plate:text-plate-muted-figure">
        {unit}
      </span>
    </AlwaysEnglish>
  );
}

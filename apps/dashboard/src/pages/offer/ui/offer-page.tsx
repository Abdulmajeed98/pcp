import type { OfferResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { useParams } from 'react-router';

import { iqdPriceShown, useOffer, usdPriceShown } from '@/entities/offer';
import { useVendorShown } from '@/entities/vendor';
import { OfferedPart } from '@/features/offer-form';
import { WhyNotAnsweredInThePortal } from '@/shared/api';
import { Trans, useTranslation } from '@/shared/i18n';
import { Alert, AlertDescription, AlertTitle, BackLink, Plate } from '@/shared/ui';

// One of the Vendor's Offers, as the catalog search leads to it from a Part
// the Vendor offers: the Part at its head, as the Offer form shows it, then
// its prices, each on its own plate, its stock and its warranty. Changing
// and removing it arrive with ticket 05, which makes this screen the form.
//
// Its way back, `..`, is written relative to its route, so that it reaches
// the Offers screen under either frame.
export function OfferPage() {
  const { t } = useTranslation();
  const { vendorId } = useVendorShown();
  const { offerId = '' } = useParams();
  const offer = useOffer(vendorId, offerId);

  return (
    <div data-testid="offer-screen" className="flex flex-col gap-4">
      <BackLink to="..">{t('OfferScreen.back')}</BackLink>
      <h1 className="text-xl font-semibold sm:text-2xl">{t('OfferScreen.title')}</h1>
      {offer.error ? (
        <Alert variant="destructive" data-testid="refusal">
          <AlertTitle>{t('OfferScreen.notRead')}</AlertTitle>
          <AlertDescription>
            <WhyNotAnsweredInThePortal error={offer.error} />
          </AlertDescription>
        </Alert>
      ) : offer.data === undefined ? (
        <p className="text-sm text-muted-foreground">{t('OfferScreen.reading')}</p>
      ) : (
        <TheOffer offer={offer.data} />
      )}
    </div>
  );
}

function TheOffer({ offer }: { offer: OfferResponse }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <OfferedPart part={offer.part} />
      <p className="flex flex-wrap gap-2">
        {offer.usdPrice !== null && (
          <Plate>
            <AlwaysEnglish data-testid="usd-price">
              {usdPriceShown(offer.usdPrice)}
            </AlwaysEnglish>
          </Plate>
        )}
        {offer.iqdPrice !== null && (
          <Plate>
            <AlwaysEnglish data-testid="iqd-price">
              {iqdPriceShown(offer.iqdPrice)}
            </AlwaysEnglish>
          </Plate>
        )}
      </p>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span
          data-testid="stock"
          data-in-stock={offer.inStock}
          className={offer.inStock ? 'text-success' : 'text-muted-foreground'}
        >
          {offer.inStock ? t('Offer.inStock') : t('Offer.outOfStock')}
        </span>
        {offer.warrantyMonths !== null && (
          <span data-testid="warranty" className="text-muted-foreground">
            <Trans
              i18nKey="Offer.warranty"
              count={offer.warrantyMonths}
              components={{ count: <>{formatNumber(offer.warrantyMonths)}</> }}
            />
          </span>
        )}
      </p>
    </div>
  );
}

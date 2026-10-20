import type { EditOfferRequest, OfferResponse } from '@pcp/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PackageXIcon } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';

import { askAgainAfterAChangeToTheOffers, useOffer } from '@/entities/offer';
import { useVendorShown } from '@/entities/vendor';
import { formValuesOf, OfferForm } from '@/features/offer-form';
import { RemoveOffer } from '@/features/remove-offer';
import { apiClient, dataOf, Refusal, WhyNotAnsweredInThePortal } from '@/shared/api';
import { useTranslation } from '@/shared/i18n';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  BackLink,
  buttonVariants,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/ui';

// One of the Vendor's Offers, opened from its row on the Offers screen or
// from the catalog search: the Offer form of a new Offer, filled with the
// Offer's details as they are, in which the Vendor changes its prices, its
// stock and its warranty (OFF-4), and below it the way to remove it, which
// asks first. Saving it, changed or not, confirms it (OFF-5), and the screen
// returns to the Offers; so does a removal. Either asks every query about the
// Vendor's Offers again. An Offer that no longer exists, opened by an old
// link, says so in the portal's language, with the way to the Offers.
//
// Its way back, and the way it leads after a save or a removal, `..`, are
// written relative to its route, so that they reach the Offers screen under
// either frame.
export function OfferPage() {
  const { t } = useTranslation();
  const { vendorId } = useVendorShown();
  const { offerId = '' } = useParams();
  const offer = useOffer(vendorId, offerId);
  const gone = offer.error instanceof Refusal && offer.error.code === 'OFFER_NOT_FOUND';

  return (
    <div data-testid="offer-screen" className="flex flex-col gap-4">
      <BackLink to="..">{t('OfferScreen.back')}</BackLink>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold sm:text-2xl">{t('OfferScreen.title')}</h1>
        {!gone && <p className="text-sm text-muted-foreground">{t('OfferScreen.intro')}</p>}
      </div>
      {gone ? (
        <OfferGone />
      ) : offer.error ? (
        <Alert variant="destructive" data-testid="refusal">
          <AlertTitle>{t('OfferScreen.notRead')}</AlertTitle>
          <AlertDescription>
            <WhyNotAnsweredInThePortal error={offer.error} />
          </AlertDescription>
        </Alert>
      ) : offer.data === undefined ? (
        <p className="text-sm text-muted-foreground">{t('OfferScreen.reading')}</p>
      ) : (
        <ChangeTheOffer vendorId={vendorId} offer={offer.data} />
      )}
    </div>
  );
}

function ChangeTheOffer({ vendorId, offer }: { vendorId: string; offer: OfferResponse }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const backToTheOffers = async () => {
    await navigate('..');
  };
  const change = useMutation({
    mutationFn: (body: EditOfferRequest) =>
      dataOf(apiClient.editOffer({ path: { vendorId, offerId: offer.id }, body })),
    // Every query a change to the Offers changes is asked again before the
    // screen is left, so that the list it returns to shows the Offer as saved.
    onSuccess: async () => {
      await askAgainAfterAChangeToTheOffers(queryClient, vendorId, { refetchType: 'all' });
      await backToTheOffers();
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <OfferForm
        part={offer.part}
        values={formValuesOf(offer)}
        purpose="change"
        save={(details) => change.mutateAsync(details)}
      />
      <RemoveOffer vendorId={vendorId} offer={offer} onRemoved={backToTheOffers} />
    </div>
  );
}

// What the screen says of an Offer that no longer exists, such as one the
// Vendor removed, opened by an old link.
function OfferGone() {
  const { t } = useTranslation();

  return (
    <Empty data-testid="offer-gone" className="border-y border-border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PackageXIcon />
        </EmptyMedia>
        <EmptyTitle>{t('OfferScreen.gone')}</EmptyTitle>
        <EmptyDescription>{t('OfferScreen.goneDescription')}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link to=".." className={buttonVariants({ variant: 'outline' })}>
          {t('OfferScreen.openOffers')}
        </Link>
      </EmptyContent>
    </Empty>
  );
}

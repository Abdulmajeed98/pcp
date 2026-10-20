import type { CreateOfferRequest } from '@pcp/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router';

import { type AddedOffer, vendorsOffersKey } from '@/entities/offer';
import { usePart } from '@/entities/part';
import { useVendorShown } from '@/entities/vendor';
import { OfferForm } from '@/features/offer-form';
import { apiClient, dataOf, WhyNotAnsweredInThePortal } from '@/shared/api';
import { useTranslation } from '@/shared/i18n';
import { Alert, AlertDescription, AlertTitle, BackLink } from '@/shared/ui';

// The Vendor portal's screen for a new Offer of a Part, opened from a result
// of the catalog search, whose search its address keeps. Adding the Offer is
// its first Confirmation (OFF-5). After a save every query about the
// Vendor's Offers is asked again, the list, its counts and the search among
// them, and the screen returns to the search as it was, with a note that the
// Offer was added, so that the Vendor adds the next.
//
// Its way back and the way it leads after a save are written relative to its
// route, `..`, with the search kept, so that they reach the catalog search
// under either frame the portal's screens are mounted in.
export function NewOfferPage() {
  const { t } = useTranslation();
  const { vendorId } = useVendorShown();
  const { partId = '' } = useParams();
  const { search } = useLocation();
  const part = usePart(partId);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const add = useMutation({
    mutationFn: (body: CreateOfferRequest) =>
      dataOf(apiClient.createOffer({ path: { vendorId }, body })),
    onSuccess: async (added) => {
      await queryClient.invalidateQueries({ queryKey: vendorsOffersKey(vendorId) });
      await navigate(
        { pathname: '..', search },
        { state: { added: added.part.name } satisfies AddedOffer },
      );
    },
  });
  const backToTheSearch = { pathname: '..', search };

  return (
    <div data-testid="new-offer" className="flex flex-col gap-4">
      <BackLink to={backToTheSearch}>{t('NewOffer.back')}</BackLink>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold sm:text-2xl">{t('NewOffer.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('NewOffer.intro')}</p>
      </div>
      {part.error ? (
        <Alert variant="destructive" data-testid="refusal">
          <AlertTitle>{t('NewOffer.notRead')}</AlertTitle>
          <AlertDescription>
            <WhyNotAnsweredInThePortal error={part.error} />
          </AlertDescription>
        </Alert>
      ) : part.data === undefined ? (
        <p className="text-sm text-muted-foreground">{t('NewOffer.reading')}</p>
      ) : (
        <OfferForm part={part.data} save={(body) => add.mutateAsync(body)} />
      )}
    </div>
  );
}

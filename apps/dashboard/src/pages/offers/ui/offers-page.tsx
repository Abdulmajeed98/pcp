import { PlusIcon } from 'lucide-react';
import { Link } from 'react-router';

import { useVendorsOffers } from '@/entities/offer';
import { useVendorShown } from '@/entities/vendor';
import { ConfirmedAll, useConfirmAllOffers } from '@/features/confirm-all-offers';
import { WhyNotAnsweredInThePortal } from '@/shared/api';
import { useTranslation } from '@/shared/i18n';
import { Alert, AlertDescription, AlertTitle, buttonVariants } from '@/shared/ui';

import { useSearchInTheAddress } from '../model/search';
import { ExpiryBanner } from './expiry-banner';
import { ListedOffers, NoOffers } from './listed-offers';
import { SearchForm } from './search-form';

// The Vendor portal's first screen: the Vendor's Offers, in the portal's
// language, laid out for a phone 360 pixels wide first.
//
// At its head, its title, with the way to add an Offer from the catalog
// search beside it, `add`, relative to its route. Under the title the banner, while any Offer is expired or
// about to expire, with the button that confirms them all, and below it,
// once they are confirmed, how many were. Then the search of the Vendor's own
// Offers, and the Offers it found, a page at a time. A Vendor with no Offer
// at all is told so, in place of the search and the list. The banner's counts
// are of all the Vendor's Offers, whatever the search, and arrive with the
// list.
export function OffersPage() {
  const { t } = useTranslation();
  const { vendorId } = useVendorShown();
  const [search, show] = useSearchInTheAddress();
  const listed = useVendorsOffers(vendorId, search);
  const confirming = useConfirmAllOffers(vendorId);

  return (
    <div data-testid="offers-screen" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold sm:text-2xl">{t('OffersScreen.title')}</h1>
        <Link
          to="add"
          data-testid="add-offer"
          className={buttonVariants({ variant: 'outline' })}
        >
          <PlusIcon data-icon="inline-start" />
          {t('OffersScreen.add')}
        </Link>
      </div>

      {listed.error ? (
        <Alert variant="destructive" data-testid="refusal">
          <AlertTitle>{t('OffersScreen.notListed')}</AlertTitle>
          <AlertDescription>
            <WhyNotAnsweredInThePortal error={listed.error} />
          </AlertDescription>
        </Alert>
      ) : listed.data === undefined ? (
        <Reading />
      ) : listed.data.counts.offers === 0 ? (
        <>
          <ConfirmedAll confirming={confirming} />
          <NoOffers />
        </>
      ) : (
        <>
          <ExpiryBanner counts={listed.data.counts} confirming={confirming} />
          <ConfirmedAll confirming={confirming} />
          <SearchForm search={search} onSearch={show} />
          <ListedOffers
            listed={listed.data}
            searching={listed.isPlaceholderData}
            search={search}
            onSearch={show}
          />
        </>
      )}
    </div>
  );
}

// Rows sketched where the first answer will be.
function Reading() {
  const { t } = useTranslation();

  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t('OffersScreen.reading')}</p>
      <ul aria-hidden="true" className="divide-y divide-border border-y border-border">
        {[0, 1, 2, 3].map((row) => (
          <li key={row} className="flex items-start gap-3 py-2">
            <span className="size-10 shrink-0 rounded-lg bg-secondary" />
            <span className="flex flex-1 flex-col gap-2">
              <span className="h-3.5 w-3/4 rounded-sm bg-secondary" />
              <span className="h-3.5 w-1/2 rounded-sm bg-muted" />
              <span className="h-6 w-24 rounded-sm bg-secondary" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

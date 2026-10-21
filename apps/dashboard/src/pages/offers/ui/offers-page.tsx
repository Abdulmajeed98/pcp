import { cn } from 'cn';
import { PlusIcon } from 'lucide-react';
import { Link } from 'react-router';

import { useVendorsOffers } from '@/entities/offer';
import { useVendorShown } from '@/entities/vendor';
import { ConfirmedAll, useConfirmAllOffers } from '@/features/confirm-all-offers';
import { WhyNotAnsweredInThePortal } from '@/shared/api';
import { useTranslation } from '@/shared/i18n';
import { useWideScreen } from '@/shared/lib';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  buttonVariants,
  Leaving,
  ScreenAction,
} from '@/shared/ui';

import { useSearchInTheAddress } from '../model/search';
import { ExpiryBanner } from './expiry-banner';
import { ListedOffers, NoOffers } from './listed-offers';
import { SearchForm } from './search-form';
import { StateTabs } from './state-tabs';

// The Vendor portal's first screen, the Vendor's Offers, in the portal's
// language, laid out for a phone 360 pixels wide first, as the dashboard's
// DESIGN.md lays out the Vendor portal (Framed sheet, redesign ticket 11).
//
// Its title row first, with Add an Offer from the catalog search, `add`,
// relative to its route, outlined on the title row's end side from 64rem,
// and on a phone a plus on the end side of the frame's bar, named. Then what needs action: the banner, while an Offer
// is expired or about to expire, with the button that confirms them all,
// which leaves as Motion 8 says once none is; and the line that says how
// many Confirm all confirmed, which stays. Then the tabs, All, Need
// confirming and Out of stock, each with its count; the search, in the top
// bar's centre from 64rem and below the tabs on a phone; and the Offers it
// found in the tab, a page at a time. A Vendor with no Offer at all is told
// so, in place of the tabs, the search and the list. The banner's and the
// tabs' counts are of all the Vendor's Offers, whatever the search and the
// tab, and arrive with the list.
export function OffersPage() {
  const { t } = useTranslation();
  const { vendorId } = useVendorShown();
  const [search, show] = useSearchInTheAddress();
  const listed = useVendorsOffers(vendorId, search);
  const confirming = useConfirmAllOffers(vendorId);
  const wide = useWideScreen();
  const counts = listed.data?.counts;
  const needingConfirmation =
    counts !== undefined && counts.expired + counts.aboutToExpire > 0 ? counts : null;

  return (
    // The blocks below the title row hold the space above them, so that one
    // that leaves or arrives takes its gap with it (Motion 8, the No Snap
    // Rule): a gap of the column's own would be taken out in one frame.
    <div data-testid="offers-screen" className="flex min-w-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="screen-title">{t('OffersScreen.title')}</h1>
        {wide ? (
          <Link
            to="add"
            data-testid="add-offer"
            className={buttonVariants({ variant: 'outline' })}
          >
            <PlusIcon data-icon="inline-start" />
            {t('OffersScreen.add')}
          </Link>
        ) : (
          <ScreenAction>
            <Link
              to="add"
              data-testid="add-offer"
              aria-label={t('OffersScreen.add')}
              title={t('OffersScreen.add')}
              className={buttonVariants({
                variant: 'ghost',
                size: 'icon',
                className: '-me-2',
              })}
            >
              <PlusIcon aria-hidden="true" />
            </Link>
          </ScreenAction>
        )}
      </div>

      {listed.error ? (
        <div className={gapAbove}>
          <Alert variant="destructive" data-testid="refusal">
            <AlertTitle>{t('OffersScreen.notListed')}</AlertTitle>
            <AlertDescription>
              <WhyNotAnsweredInThePortal error={listed.error} />
            </AlertDescription>
          </Alert>
        </div>
      ) : listed.data === undefined ? (
        <div className={gapAbove}>
          <Reading />
        </div>
      ) : (
        <>
          <Leaving value={needingConfirmation}>
            {(needing) => (
              <div className={gapAbove}>
                <ExpiryBanner counts={needing} confirming={confirming} />
              </div>
            )}
          </Leaving>
          <ConfirmedAll confirming={confirming} gapAbove={gapAbove} />
          {listed.data.counts.offers === 0 ? (
            <div className={gapAbove}>
              <NoOffers />
            </div>
          ) : (
            <div className={cn('flex min-w-0 flex-col gap-4', gapAbove)}>
              <StateTabs search={search} counts={listed.data.counts} />
              <SearchForm search={search} onSearch={show} />
              <ListedOffers
                listed={listed.data}
                searching={listed.isPlaceholderData}
                settling={confirming.isSuccess}
                search={search}
                onSearch={show}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// The gap above each block below the title row: 16 pixels on a phone, 24
// from 64rem.
const gapAbove = 'pt-4 lg:pt-6';

// Rows sketched in Raised Stone where the first answer will be, in the shape
// of the rows to come, still: they do not shimmer.
function Reading() {
  const { t } = useTranslation();
  const wide = useWideScreen();

  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <p className="flex min-h-control items-center justify-end text-sm text-muted-foreground">
        {t('OffersScreen.reading')}
      </p>
      <ul aria-hidden="true" className="divide-y divide-rule border-y border-rule">
        {[0, 1, 2, 3].map((row) => (
          <li
            key={row}
            className={
              wide
                ? 'flex h-14 items-center gap-6'
                : 'flex flex-col justify-center gap-2 py-3'
            }
          >
            <span className="h-3.5 w-2/5 rounded-plate bg-secondary" />
            <span className="h-6 w-28 rounded-plate bg-secondary" />
            <span className="h-3.5 w-1/4 rounded-plate bg-secondary" />
          </li>
        ))}
      </ul>
    </div>
  );
}

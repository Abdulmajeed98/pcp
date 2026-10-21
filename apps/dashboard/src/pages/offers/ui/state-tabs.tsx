import type { VendorsOfferCountsResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { Link, useLocation } from 'react-router';

import type { OffersSearch, OffersState } from '@/entities/offer';
import { useTranslation } from '@/shared/i18n';
import { useMoreBeyondTheEnd } from '@/shared/lib';

import { addressOf } from '../model/search';

// The Offers' states as the screen's tabs (DESIGN.md's Tabs): All, Need
// confirming and Out of stock, each with how many of the Vendor's Offers are
// in it, in Note Grey, of all its Offers whatever the search, as the banner
// counts them. They stand on a full-width Edge rule; the current one is in
// Ink at weight 600 with a 2-pixel Bazaar Teal line as wide as its label.
// Each is a link to the same search in that state, from its first page, so a
// reload or the back button keeps it. On a phone they scroll sideways in
// their own row, which fades at its end side while more tabs lie beyond it.
// The line moves to the chosen tab at once.
export function StateTabs({
  search,
  counts,
}: {
  search: OffersSearch;
  counts: VendorsOfferCountsResponse;
}) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [row, moreBeyond] = useMoreBeyondTheEnd<HTMLElement>();

  const tabs: { state: OffersState; name: string; count: number }[] = [
    { state: 'all', name: t('OffersScreen.all'), count: counts.offers },
    {
      state: 'needs-confirming',
      name: t('OffersScreen.needsConfirming'),
      count: counts.expired + counts.aboutToExpire,
    },
    { state: 'out-of-stock', name: t('OffersScreen.outOfStock'), count: counts.outOfStock },
  ];

  return (
    <nav
      ref={row}
      aria-label={t('OffersScreen.states')}
      data-testid="offer-states"
      data-more-beyond={moreBeyond ? '' : undefined}
      className="fade-end -mx-4 overflow-x-auto overscroll-x-contain px-4 lg:mx-0 lg:px-0"
    >
      <ul className="flex min-w-max gap-5 border-b border-border">
        {tabs.map(({ state, name, count }) => (
          <li key={state} className="flex">
            <Link
              to={{ pathname, search: addressOf({ words: search.words, state, page: 0 }) }}
              data-state={state}
              aria-current={state === search.state ? 'page' : undefined}
              className="group/tab hover-colour flex min-h-control items-stretch text-sm whitespace-nowrap text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 aria-[current=page]:text-foreground"
            >
              <span className="relative flex items-center gap-1.5 after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 group-aria-[current=page]/tab:font-semibold group-aria-[current=page]/tab:after:bg-tab-line">
                {name}{' '}
                <span
                  data-testid="state-count"
                  className="font-normal text-muted-foreground tabular-nums"
                >
                  {formatNumber(count)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

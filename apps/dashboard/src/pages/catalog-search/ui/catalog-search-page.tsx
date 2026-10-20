import { AlwaysEnglish } from '@pcp/ui';
import { CircleCheckIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router';

import type { AddedOffer } from '@/entities/offer';
import { useVendorShown } from '@/entities/vendor';
import { Trans, useTranslation } from '@/shared/i18n';
import { BackLink } from '@/shared/ui';

import { useSearchInTheAddress } from '../model/search';
import { FoundParts } from './found-parts';
import { SearchForm } from './search-form';

// The Vendor portal's search of the whole catalog, below the Offers screen,
// from which a Vendor adds an Offer (OFF-3): a search by name, manufacturer
// or part number, narrowed to a Category if it likes, and what it found, a
// page at a time, in the portal's language, laid out for a phone 360 pixels
// wide first. A Part the Vendor offers is marked and leads to the Offer; any
// other opens the form for a new Offer of it.
//
// After a save the form returns here, with the search as it was, and a note,
// announced when it appears, says the Offer was added and names its Part,
// until another search is shown: a Sheet panel with a Confirmed Green edge,
// its title in Confirmed Green after a circled tick, the sentence, and a link
// to the Offers, as the owner chose on 20 October 2026. Its way back, `..`, is written
// relative to its route, so that it reaches the Offers screen under either
// frame.
export function CatalogSearchPage() {
  const { t } = useTranslation();
  const { vendorId } = useVendorShown();
  const [search, show] = useSearchInTheAddress();
  const added = (useLocation().state as AddedOffer | null)?.added;

  return (
    <div data-testid="catalog-search" className="flex flex-col gap-4">
      <BackLink to="..">{t('CatalogSearch.back')}</BackLink>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold sm:text-2xl">{t('CatalogSearch.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('CatalogSearch.intro')}</p>
      </div>
      <output
        data-testid={added === undefined ? undefined : 'offer-added'}
        className={
          added === undefined
            ? 'sr-only'
            : 'flex flex-col gap-1 rounded-lg border border-success bg-card p-3 text-sm'
        }
      >
        {added !== undefined && (
          <>
            <span className="flex items-center gap-2 text-base font-medium text-success">
              <CircleCheckIcon aria-hidden="true" className="size-4 shrink-0" />
              {t('CatalogSearch.addedTitle')}
            </span>
            <span>
              <Trans
                i18nKey="CatalogSearch.added"
                components={{ name: <AlwaysEnglish>{added}</AlwaysEnglish> }}
              />
            </span>
            <Link
              to=".."
              data-testid="see-offers"
              className="flex min-h-control items-center self-start underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {t('CatalogSearch.seeOffers')}
            </Link>
          </>
        )}
      </output>
      <SearchForm search={search} onSearch={show} />
      <FoundParts vendorId={vendorId} search={search} onSearch={show} />
    </div>
  );
}

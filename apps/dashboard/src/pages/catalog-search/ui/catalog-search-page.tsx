import { AlwaysEnglish } from '@pcp/ui';
import { CircleCheckIcon } from 'lucide-react';
import { useLocation } from 'react-router';

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
// After a save the form returns here, with the search as it was, and a note
// in Confirmed Green, announced when it appears, names the Part whose Offer
// was added, until another search is shown. Its way back, `..`, is written
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
            : 'flex items-start gap-2 text-sm font-medium text-success'
        }
      >
        {added !== undefined && (
          <>
            <CircleCheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>
              <Trans
                i18nKey="CatalogSearch.added"
                components={{ name: <AlwaysEnglish>{added}</AlwaysEnglish> }}
              />
            </span>
          </>
        )}
      </output>
      <SearchForm search={search} onSearch={show} />
      <FoundParts vendorId={vendorId} search={search} onSearch={show} />
    </div>
  );
}

import { AlwaysEnglish } from '@pcp/ui';
import { CircleCheckIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router';

import type { AddedOffer } from '@/entities/offer';
import { useVendorShown } from '@/entities/vendor';
import { Trans, useTranslation } from '@/shared/i18n';
import { BackLink, Leaving } from '@/shared/ui';

import { useSearchInTheAddress } from '../model/search';
import { FoundParts } from './found-parts';
import { SearchForm } from './search-form';

// The Vendor portal's search of the whole catalog, below the Offers screen,
// from which a Vendor adds an Offer (OFF-3): a search by name, manufacturer
// or part number, narrowed to a Category if it likes, and what it found, a
// page at a time, in the portal's language, laid out for a phone 360 pixels
// wide first, as the dashboard's DESIGN.md lays it out (Framed sheet,
// redesign ticket 12): a back link, its title and one Note Grey sentence,
// then the note after an Offer is added, the search with its Category, the
// count in words and the rows. A Part the Vendor offers is marked and leads
// to the Offer; any other opens the form for a new Offer of it.
//
// After a save the form returns here, with the search as it was, and a note,
// announced when it appears, says the Offer was added and names its Part,
// until the next search: a Sheet panel with a Confirmed Green edge and
// 8-pixel corners, its title in Confirmed Green after a circled tick, the
// sentence, and a link to the Offers, as the owner chose on 20 October 2026.
// It arrives as Motion 6 says, with the screen, and on the next search it
// leaves as Motion 8 says: it fades, then its space closes, so that the
// search below it rises into place rather than jumps (the No Snap Rule). Its
// way back, `..`, is written relative to its route, so that it reaches the
// Offers screen under either frame.
export function CatalogSearchPage() {
  const { t } = useTranslation();
  const { vendorId } = useVendorShown();
  const [search, show] = useSearchInTheAddress();
  const added = (useLocation().state as AddedOffer | null)?.added ?? null;

  return (
    // The blocks below the title hold the gap above them, so that the note,
    // which leaves, takes its gap with it (Motion 8): a gap of the column's
    // own would be taken out in one frame.
    <div data-testid="catalog-search" className="flex min-w-0 flex-col">
      <div className="flex flex-col gap-4">
        <BackLink to="..">{t('CatalogSearch.back')}</BackLink>
        <div className="flex flex-col gap-2">
          <h1 className="screen-title">{t('CatalogSearch.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('CatalogSearch.intro')}</p>
        </div>
      </div>
      {/* The live region is always there, so that the note is announced when
          it appears in it. */}
      <output className="block">
        <Leaving value={added}>
          {(name) => (
            <div className={gapAbove}>
              <AddedNote name={name} />
            </div>
          )}
        </Leaving>
      </output>
      <div className={gapAbove}>
        <SearchForm search={search} onSearch={show} />
      </div>
      <div className={gapAbove}>
        <FoundParts vendorId={vendorId} search={search} onSearch={show} />
      </div>
    </div>
  );
}

// The gap above each block below the title: 16 pixels on a phone, 24 from
// 64rem.
const gapAbove = 'pt-4 lg:pt-6';

// The note that an Offer was added, naming its Part, with the way to the
// Offers.
function AddedNote({ name }: { name: string }) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="offer-added"
      className="arrives flex flex-col gap-1 rounded-card border border-success bg-card px-4 pt-3 pb-1 text-sm"
    >
      <span className="flex items-center gap-2 text-base font-semibold text-success">
        <CircleCheckIcon aria-hidden="true" className="size-4 shrink-0" />
        {t('CatalogSearch.addedTitle')}
      </span>
      <span>
        <Trans
          i18nKey="CatalogSearch.added"
          components={{ name: <AlwaysEnglish>{name}</AlwaysEnglish> }}
        />
      </span>
      <Link
        to=".."
        data-testid="see-offers"
        className="hover-colour flex min-h-control items-center self-start underline underline-offset-4 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {t('CatalogSearch.seeOffers')}
      </Link>
    </div>
  );
}

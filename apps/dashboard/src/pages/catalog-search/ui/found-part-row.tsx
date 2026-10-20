import type { FoundPartResponse } from '@pcp/api-client';
import { AlwaysEnglish } from '@pcp/ui';
import { CircleCheckIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router';

import { categoryName } from '@/entities/category';
import { PartPicture } from '@/entities/part';
import { useTranslation } from '@/shared/i18n';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui';

// One Part the search found: its picture, its name, one secondary line with
// its manufacturer and its Category, and its part numbers on a line of their
// own, so that the number a Vendor matches against the box is read whole,
// left to right, as the Offer form's head shows it; the owner chose it on 20
// October 2026 over the Catalog's one secondary line. The whole row is the
// link, while the link's name is the Part's alone.
//
// A Part the Vendor offers is marked, in Confirmed Green with a circled tick,
// on a line of its own, and leads to the Offer, so that the Vendor does not
// try to add a second one (OFF-1). Any other leads to the form for a new
// Offer of it, which keeps the search in its address. A Part's name, its
// manufacturer and its part numbers are English in every language (LANG-3),
// and its Category is named in the shared terms.
export function FoundPartRow({ part }: { part: FoundPartResponse }) {
  const { t } = useTranslation();
  const { search } = useLocation();
  const to =
    part.offerId === null ? { pathname: part.id, search } : `../offers/${part.offerId}`;

  return (
    <Item
      data-testid="found-part"
      data-offered={part.offerId !== null}
      className="relative items-start rounded-none px-0 hover:bg-secondary has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2"
    >
      <ItemMedia>
        <PartPicture part={part} />
      </ItemMedia>
      <ItemContent className="gap-1">
        <ItemTitle>
          <Link to={to} className="after:absolute after:inset-0 focus-visible:outline-none">
            <AlwaysEnglish data-testid="part-name">{part.name}</AlwaysEnglish>
          </Link>
        </ItemTitle>
        <ItemDescription>
          <AlwaysEnglish>{part.manufacturer}</AlwaysEnglish>
          {' · '}
          <span data-testid="category" data-category={part.category}>
            {categoryName(part.category)}
          </span>
        </ItemDescription>
        {part.partNumbers.length > 0 && (
          <ItemDescription>
            <AlwaysEnglish data-testid="part-numbers">
              {part.partNumbers.join(', ')}
            </AlwaysEnglish>
          </ItemDescription>
        )}
        {part.offerId !== null && (
          <p
            data-testid="offered"
            className="flex items-center gap-1 text-sm font-medium text-success"
          >
            <CircleCheckIcon aria-hidden="true" className="size-4 shrink-0" />
            {t('CatalogSearch.offered')}
          </p>
        )}
      </ItemContent>
    </Item>
  );
}

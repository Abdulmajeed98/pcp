import type { PartMissingSpecificationsResponse } from '@pcp/api-client';
import { formatNumber } from '@pcp/i18n';
import { AlwaysEnglish } from '@pcp/ui';
import { cn } from 'cn';
import { CircleAlertIcon } from 'lucide-react';
import { Link, useMatch } from 'react-router';

import { categoryName } from '@/entities/category';
import { PartPicture } from '@/entities/part';
import { useAddressKeepingTheQuery } from '@/shared/lib';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui';

// One Part on the list, drawn as the Catalog's row is: its picture, its name,
// and one secondary line with its manufacturer, its Category and its count of
// Offers. The row then ends with one line in Action Red that says what it
// lacks, by the labels of the needed specifications, after a circled
// exclamation mark, as a Part's page marks one. The whole row opens the
// Part's edit form, while the link's name is the Part's alone, and the page
// of the list stays on its address. The row of the Part open beside the list
// is marked as the open one, on a Shelf ground.
export function PartRow({ part }: { part: PartMissingSpecificationsResponse }) {
  const keepingTheQuery = useAddressKeepingTheQuery();
  const opened =
    useMatch('/missing-specifications/parts/:partId/*')?.params.partId === part.id;
  const offers = part.offerCount === 1 ? 'Offer' : 'Offers';

  return (
    <Item
      className={cn(
        'relative rounded-none px-0 hover:bg-secondary has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2',
        opened && 'bg-secondary',
      )}
    >
      <ItemMedia>
        <PartPicture part={part} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          <Link
            to={keepingTheQuery(`/missing-specifications/parts/${part.id}/edit`)}
            aria-current={opened ? 'page' : undefined}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            <AlwaysEnglish>{part.name}</AlwaysEnglish>
          </Link>
        </ItemTitle>
        <ItemDescription>
          <AlwaysEnglish>{part.manufacturer}</AlwaysEnglish>
          {' · '}
          {categoryName(part.category)}
          {' · '}
          <span data-testid="offer-count">
            {formatNumber(part.offerCount)} {offers}
          </span>
        </ItemDescription>
        <p
          data-testid="lacks"
          className="flex items-start gap-1.5 text-sm font-medium text-destructive"
        >
          <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            Lacks {part.missingSpecifications.map(({ label }) => label).join(', ')}
          </span>
        </p>
      </ItemContent>
    </Item>
  );
}

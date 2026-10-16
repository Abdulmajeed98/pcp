import type { PartSummaryResponse } from '@pcp/api-client';
import { AlwaysEnglish } from '@pcp/ui';
import { cn } from 'cn';
import { Link, useMatch } from 'react-router';

import { categoryName } from '@/entities/category';
import { PartPicture } from '@/entities/part';
import { useAddressKeepingTheQuery } from '@/shared/lib';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui';

// One Part in the Catalog's results: its picture, its name, and one
// secondary line with its manufacturer, its Category and its part numbers.
// The whole row opens the Part's page, while the link's name is the Part's
// alone, and the search stays on its address. The row of the Part open beside
// the list is marked as the open one, on a Shelf ground. A Part's name, its
// manufacturer and its part numbers are English in every language, and are
// kept apart from the text around them.
export function PartRow({ part }: { part: PartSummaryResponse }) {
  const keepingTheQuery = useAddressKeepingTheQuery();
  const opened = useMatch('/catalog/parts/:partId/*')?.params.partId === part.id;

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
            to={keepingTheQuery(`/catalog/parts/${part.id}`)}
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
          {part.partNumbers.length > 0 && (
            <>
              {' · '}
              <AlwaysEnglish>{part.partNumbers.join(', ')}</AlwaysEnglish>
            </>
          )}
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}

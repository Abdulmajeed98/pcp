import type { PartSummaryResponse } from '@pcp/api-client';
import { AlwaysEnglish } from '@pcp/ui';
import { Link } from 'react-router';

import { categoryName } from '@/entities/category';
import { PartPicture } from '@/entities/part';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui';

// One Part in the Catalog's results: its picture, its name, and one
// secondary line with its manufacturer, its Category and its part numbers.
// The whole row opens the Part's page, while the link's name is the Part's
// alone. A Part's name, its manufacturer and its part numbers are English in
// every language, and are kept apart from the text around them.
export function PartRow({ part }: { part: PartSummaryResponse }) {
  return (
    <Item className="relative rounded-none px-0 hover:bg-secondary has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2">
      <ItemMedia>
        <PartPicture part={part} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          <Link
            to={`/catalog/parts/${part.id}`}
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

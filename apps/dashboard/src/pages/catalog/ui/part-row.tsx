import type { PartSummaryResponse } from '@pcp/api-client';
import { AlwaysEnglish, CategoryIcon } from '@pcp/ui';

import { categoryName } from '@/entities/category';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/shared/ui';

// One Part in the Catalog's results: its Category's icon, its name, and one
// secondary line with its manufacturer, its Category and its part numbers.
// A Part's name, its manufacturer and its part numbers are English in every
// language, and are kept apart from the text around them.
export function PartRow({ part }: { part: PartSummaryResponse }) {
  return (
    <Item className="rounded-none px-0">
      <ItemMedia variant="icon">
        <CategoryIcon category={part.category} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          <AlwaysEnglish>{part.name}</AlwaysEnglish>
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

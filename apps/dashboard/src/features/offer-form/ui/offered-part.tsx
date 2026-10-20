import type { PartSummaryResponse } from '@pcp/api-client';
import { AlwaysEnglish } from '@pcp/ui';

import { categoryName } from '@/entities/category';
import { PartPicture } from '@/entities/part';

// The Part an Offer is for, at the head of the Offer's form or screen, so
// that the Vendor knows it picked the right one: its picture, its name, one
// secondary line with its manufacturer and its Category, and its part
// numbers, on a Sheet panel. A Part's name, its manufacturer and its part
// numbers are English in every language (LANG-3), and its Category is named
// in the shared terms.
export function OfferedPart({ part }: { part: PartSummaryResponse }) {
  return (
    <div
      data-testid="offered-part"
      className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
    >
      <PartPicture part={part} />
      <div className="flex min-w-0 flex-col gap-0.5 text-sm">
        <AlwaysEnglish data-testid="part-name" className="font-medium">
          {part.name}
        </AlwaysEnglish>
        <p className="text-muted-foreground">
          <AlwaysEnglish>{part.manufacturer}</AlwaysEnglish>
          {' · '}
          <span data-testid="category" data-category={part.category}>
            {categoryName(part.category)}
          </span>
        </p>
        {part.partNumbers.length > 0 && (
          <AlwaysEnglish data-testid="part-numbers" className="text-muted-foreground">
            {part.partNumbers.join(', ')}
          </AlwaysEnglish>
        )}
      </div>
    </div>
  );
}

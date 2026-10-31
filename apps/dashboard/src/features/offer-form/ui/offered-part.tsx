import type { PartSummaryResponse } from '@pcp/api-client';
import { AlwaysEnglish } from '@pcp/ui';

import { categoryName } from '@/entities/category';
import { PartNumbers, PartPicture } from '@/entities/part';

// The Part an Offer is for, at the head of the Offer form, so that the
// Vendor knows it picked the right one, on a Raised Stone panel with 8-pixel
// corners and no edge, as DESIGN.md's Offer form has it: its picture, its
// name at weight 550, one Note Grey line with its manufacturer and its
// Category, and its part numbers on a line of their own, in Geist Mono. A
// Part's name, its manufacturer and its part numbers are English in every
// language (LANG-3), and its Category is named in the shared terms.
export function OfferedPart({ part }: { part: PartSummaryResponse }) {
  return (
    <div
      data-testid="offered-part"
      className="flex items-start gap-3 rounded-card bg-secondary p-3"
    >
      <PartPicture part={part} />
      {/* Each English text starts on the line's start side in every
          direction; a long name or a run of part numbers wraps in a box of
          its own, its lines starting on its left, so that it is read whole
          in Kurdish and Arabic too (redesign ticket 11's break-ui). */}
      <div className="flex min-w-0 flex-col gap-0.5 text-sm">
        <p className="font-[550]">
          <AlwaysEnglish data-testid="part-name" className="block w-fit max-w-full">
            {part.name}
          </AlwaysEnglish>
        </p>
        <p className="text-muted-foreground">
          <AlwaysEnglish>{part.manufacturer}</AlwaysEnglish>
          {' · '}
          <span data-testid="category" data-category={part.category}>
            {categoryName(part.category)}
          </span>
        </p>
        <PartNumbers part={part} className="block w-fit max-w-full" />
      </div>
    </div>
  );
}

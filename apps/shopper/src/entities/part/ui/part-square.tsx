import type { VisiblePartResponse } from '@pcp/api-client';
import { CategoryIcon } from '@pcp/ui';
import { cn } from 'cn';
import Image from 'next/image';

import { photoAddress } from '../model/addresses';

// A Part's photo, or its Category's icon in its place, in the small square on
// the start side of its line on a Category page (DESIGN.md's A Part on a
// Category page): 48 pixels, 40 on a phone, the photo whole on white, as a
// product shot has it, or the icon at 24 pixels in the Ink on the Board
// (CAT-6). Neither is ever mirrored. The Shopper app serves the photo from its
// own address, at the width it is drawn at, and only once it is near the
// window. The Part's name is printed beside it, so a reader is not told it
// again.
export function PartSquare({
  part,
}: {
  part: Pick<VisiblePartResponse, 'category' | 'photoPath'>;
}) {
  return (
    <span
      data-testid="part-square"
      className={cn(
        'grid size-10 shrink-0 place-items-center overflow-hidden md:size-12',
        part.photoPath === null ? 'bg-secondary text-foreground' : 'bg-white',
      )}
    >
      {part.photoPath === null ? (
        <CategoryIcon category={part.category} size={24} strokeWidth={1.5} />
      ) : (
        <Image
          src={photoAddress(part.photoPath)}
          alt=""
          width={48}
          height={48}
          sizes="(min-width: 48rem) 48px, 40px"
          className="size-full object-contain"
        />
      )}
    </span>
  );
}

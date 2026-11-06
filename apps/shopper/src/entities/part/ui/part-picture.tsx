import type { VisiblePartResponse } from '@pcp/api-client';
import { CategoryIcon } from '@pcp/ui';
import { cn } from 'cn';
import Image from 'next/image';

import { photoAddress } from '../model/addresses';

// A Part's photo, and its Category's icon in its place (DESIGN.md's A Part's
// photo): the photo fills its square, its whole shown on white, as a
// product shot has it, square-cornered, with the plate's notch cut into its
// end edge; a Part with no photo shows its Category's icon in its place,
// drawn in the Ink at 40% of the square, on Sheet Paper, so that it stands
// off the plate's Board (CAT-6). Neither is ever mirrored. The Shopper app
// serves the photo from its own address, at the width it is drawn at. The
// Part's name is printed beside it, so a reader is not told it again.
export function PartPicture({
  part,
  sizes,
  className,
}: {
  part: Pick<VisiblePartResponse, 'category' | 'photoPath'>;
  sizes: string;
  className?: string;
}) {
  return (
    <div
      data-testid="part-picture"
      className={cn(
        'notched-end relative aspect-square w-full',
        part.photoPath === null
          ? 'grid place-items-center bg-card text-foreground'
          : 'bg-white',
        className,
      )}
    >
      {part.photoPath === null ? (
        <CategoryIcon category={part.category} className="size-[40%]" strokeWidth={1.25} />
      ) : (
        <Image
          src={photoAddress(part.photoPath)}
          alt=""
          fill
          sizes={sizes}
          className="object-contain"
        />
      )}
    </div>
  );
}

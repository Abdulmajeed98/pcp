import type { PartSummaryResponse } from '@pcp/api-client';
import { CategoryIcon } from '@pcp/ui';
import { cn } from 'cn';

import { settings } from '@/shared/config';

// A Part's picture: its photo, or its Category's icon on a quiet square when
// it has none (CAT-6). A row shows it small, and a Part's page large. The
// photo is served by the API at its own address, which a replaced photo
// changes, so a browser keeps it for as long as it likes.
//
// In a row the photo is decorative, because the Part's name is beside it. On
// a Part's page it is what the Part looks like, and says so.
export function PartPicture({
  part,
  size = 'row',
}: {
  part: Pick<PartSummaryResponse, 'category' | 'name' | 'photoPath'>;
  size?: 'row' | 'page';
}) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary text-secondary-foreground',
        size === 'row' ? 'size-10' : 'size-20',
      )}
    >
      {part.photoPath === null ? (
        <CategoryIcon
          category={part.category}
          className={size === 'row' ? 'size-5' : 'size-9'}
        />
      ) : (
        <img
          src={`${settings.apiUrl}${part.photoPath}`}
          alt={size === 'row' ? '' : `Photo of ${part.name}`}
          loading={size === 'row' ? 'lazy' : undefined}
          decoding="async"
          className="size-full object-cover"
        />
      )}
    </span>
  );
}

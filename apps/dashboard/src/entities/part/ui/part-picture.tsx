import type { PartSummaryResponse } from '@pcp/api-client';
import { CategoryIcon } from '@pcp/ui';
import { cn } from 'cn';

// A Part's picture: its Category's icon on a quiet square, as a Part with no
// photo shows it (CAT-6). A row shows it small, and a Part's page large.
export function PartPicture({
  part,
  size = 'row',
}: {
  part: Pick<PartSummaryResponse, 'category'>;
  size?: 'row' | 'page';
}) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground',
        size === 'row' ? 'size-10' : 'size-20',
      )}
    >
      <CategoryIcon
        category={part.category}
        className={size === 'row' ? 'size-5' : 'size-9'}
      />
    </span>
  );
}

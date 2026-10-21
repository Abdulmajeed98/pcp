import type { PartSummaryResponse } from '@pcp/api-client';
import { CategoryIcon } from '@pcp/ui';
import { cn } from 'cn';

import { settings } from '@/shared/config';

// A Part's picture: its photo, or its Category's icon when it has none
// (CAT-6). A row shows it small, and a Part's page large. The photo is
// served by the API at its own address, which a replaced photo changes, so a
// browser keeps it for as long as it likes.
//
// In a row the photo is decorative, because the Part's name is beside it. On
// a Part's page it is what the Part looks like, and says so.
//
// On a Part's page it follows the dashboard's DESIGN.md (redesign ticket 08):
// the photo in an 80-pixel square with 8-pixel corners, or the Category's
// icon at 32 pixels in Note Grey, plain, with no tinted square behind it. A
// photo `arriving`, one added while the page is open, fades in where the
// icon or the old photo was, 200 ms on the ease-out curve (Motion 6, in
// place, with no rise). A row's picture is left as it was for the screens
// that show it, until their own tickets.
export function PartPicture({
  part,
  size = 'row',
  arriving = false,
}: {
  part: Pick<PartSummaryResponse, 'category' | 'name' | 'photoPath'>;
  size?: 'row' | 'page';
  arriving?: boolean;
}) {
  if (size === 'page') {
    const described = `Photo of ${part.name}`;
    if (part.photoPath === null) {
      return (
        <span className="flex shrink-0 text-muted-foreground">
          <CategoryIcon category={part.category} className="size-8" />
        </span>
      );
    }
    return (
      <span className="flex size-20 shrink-0 overflow-hidden rounded-card border border-border">
        <img
          // A new photo is a new picture, which arrives of its own.
          key={part.photoPath}
          src={`${settings.apiUrl}${part.photoPath}`}
          alt={described}
          decoding="async"
          className={cn(
            'size-full object-cover',
            arriving && 'transition-opacity duration-200 ease-out starting:opacity-0',
          )}
        />
      </span>
    );
  }

  return (
    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary text-secondary-foreground">
      {part.photoPath === null ? (
        <CategoryIcon category={part.category} className="size-5" />
      ) : (
        <img
          src={`${settings.apiUrl}${part.photoPath}`}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      )}
    </span>
  );
}

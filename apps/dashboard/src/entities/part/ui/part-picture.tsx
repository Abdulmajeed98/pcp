import type { PartSummaryResponse } from '@pcp/api-client';
import { CategoryIcon } from '@pcp/ui';
import { cn } from 'cn';
import { useState } from 'react';

import { settings } from '@/shared/config';

type PictureOf = Pick<PartSummaryResponse, 'category' | 'name' | 'photoPath'>;

// A Part's picture: its photo, or its Category's icon when it has none
// (CAT-6). The Offer form's head shows it small, and a Part's page large.
// The photo is served by the API at its own address, which a replaced photo
// changes, so a browser keeps it for as long as it likes.
//
// At the Offer form's head the photo is decorative, because the Part's name
// is beside it. On a Part's page it is what the Part looks like, and says so.
export function PartPicture({
  part,
  size = 'form',
}: {
  part: PictureOf;
  size?: 'form' | 'page';
}) {
  if (size === 'page') return <PagePicture part={part} />;

  // At the Offer form's head, as DESIGN.md has it (redesign ticket 12): the
  // photo in a 48-pixel square with 8-pixel corners and an Edge, or the
  // Category's icon at 32 pixels in Note Grey, plain, with no square.
  return part.photoPath === null ? (
    <span data-testid="part-picture" className="flex size-8 shrink-0 text-muted-foreground">
      <CategoryIcon category={part.category} className="size-8" />
    </span>
  ) : (
    <span
      data-testid="part-picture"
      className="flex size-12 shrink-0 overflow-hidden rounded-card border border-border"
    >
      <img
        src={`${settings.apiUrl}${part.photoPath}`}
        alt=""
        loading="lazy"
        decoding="async"
        className="size-full object-cover"
      />
    </span>
  );
}

// On a Part's page, as the dashboard's DESIGN.md has it (redesign ticket
// 08): the photo in an 80-pixel square with 8-pixel corners and an Edge, or
// the Category's icon at 32 pixels in Note Grey, plain, with no tinted square
// behind it. A photo added while the page is open comes in under the No Snap
// Rule: the square grows from the icon's size to the photo's, so that the
// name beside it moves over smoothly, and once the new photo is loaded it
// fades in over what was there, the icon or the old photo, which is taken
// away only once it is covered. The photo the page opens with is simply
// there.
function PagePicture({ part }: { part: PictureOf }) {
  const photo = part.photoPath;
  // The photo drawn in full, under any newer one.
  const [covered, setCovered] = useState(photo);
  // The newer photo, once loaded, which then fades in.
  const [loaded, setLoaded] = useState<string | null>(null);
  const newer = photo !== null && photo !== covered ? photo : null;
  const described = `Photo of ${part.name}`;

  return (
    <span
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-card border transition-[width,height,border-color] duration-200 ease-out motion-reduce:duration-150',
        photo === null ? 'size-[2.125rem] border-transparent' : 'size-20 border-border',
      )}
    >
      {/* One list, keyed by photo, so that the newer photo, once it covers
          the older, stays the same picture as it becomes the one beneath. */}
      {[
        covered === null ? (
          <CategoryIcon
            key="icon"
            category={part.category}
            className="absolute start-0 top-0 size-8 text-muted-foreground"
          />
        ) : (
          <img
            key={covered}
            src={`${settings.apiUrl}${covered}`}
            alt={newer === null ? described : ''}
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
        ),
        newer === null ? null : (
          <img
            key={newer}
            src={`${settings.apiUrl}${newer}`}
            alt={described}
            decoding="async"
            onLoad={() => setLoaded(newer)}
            onTransitionEnd={(event) => {
              if (event.propertyName === 'opacity' && loaded === newer) setCovered(newer);
            }}
            className={cn(
              'absolute inset-0 size-full object-cover transition-opacity duration-200 ease-out motion-reduce:duration-150',
              loaded === newer ? 'opacity-100' : 'opacity-0',
            )}
          />
        ),
      ]}
    </span>
  );
}

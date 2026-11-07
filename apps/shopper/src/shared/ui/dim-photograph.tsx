import { cn } from 'cn';
import Image from 'next/image';

import type { Photograph } from '@/shared/photographs';

// A photograph under the paper, as the table a piece lies on (DESIGN.md's
// The photographs): full bleed behind its piece, dimmed to 50%, or to 62%
// behind the home page's card. It is atmosphere, so a reader is not told of
// it, and no word is ever set on it (the Text Is on Paper Rule). The piece
// that holds it is positioned and isolated, so that it lies under the
// piece's paper; the piece's ground shows while it loads. Next serves it from
// the app itself at the width it is drawn at, in a modern format. The one on
// the first screen is fetched at once, before the rest (`first`). One that
// can be the first screen's largest picture though it lies beyond the first
// screen's own piece is fetched at once too (`atOnce`), at the browser's own
// priority, as Next's guidance on images has such a picture loaded: under a
// piece an address opens at, as the home page opens at its Categories, or
// under a piece whose top shows at the foot of the first screen, as a Part
// page's Offers below the plate on a desk. The rest only when they are
// reached.
export function DimPhotograph({
  photograph,
  dimmedTo = 50,
  first = false,
  atOnce = false,
}: {
  photograph: Photograph;
  dimmedTo?: 50 | 62;
  first?: boolean;
  atOnce?: boolean;
}) {
  return (
    <Image
      src={photograph.image}
      alt=""
      fill
      sizes="100vw"
      loading={first || atOnce ? 'eager' : 'lazy'}
      fetchPriority={first ? 'high' : 'auto'}
      className={cn(
        '-z-10 object-cover',
        dimmedTo === 62 ? 'brightness-[0.62]' : 'brightness-50',
      )}
    />
  );
}

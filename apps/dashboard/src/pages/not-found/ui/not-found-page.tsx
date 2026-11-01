import { SignpostIcon } from 'lucide-react';
import { Link } from 'react-router';

import { useCentredInTheWindow } from '@/shared/lib';
import {
  buttonVariants,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/ui';

// What the Admin console shows at an address that matches none of its
// screens, such as an old link: the empty state, as the dashboard's DESIGN.md
// draws a screen that is nothing but a message, on the sheet and centred in
// the window's height, as the owner chose in redesign ticket 13: its icon
// plain, its title the screen's, one sentence and an outlined link to the
// Catalog. As the whole screen, it needs no Rule lines to set it apart. It
// holds still as it opens, as every screen does (DESIGN.md's Motion, 9).
export function NotFoundPage() {
  const centred = useCentredInTheWindow<HTMLDivElement>();

  return (
    <Empty ref={centred}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SignpostIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle level={1}>Screen not found</EmptyTitle>
        <EmptyDescription>
          This address matches no screen of the Admin console.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link to="/catalog" className={buttonVariants({ variant: 'outline' })}>
          Open the Catalog
        </Link>
      </EmptyContent>
    </Empty>
  );
}

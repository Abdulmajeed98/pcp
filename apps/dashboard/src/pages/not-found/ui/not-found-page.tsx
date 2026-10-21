import { SignpostIcon } from 'lucide-react';
import { Link } from 'react-router';

import {
  buttonVariants,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/shared/ui';

// What the Admin console shows at an address that matches none of its
// screens, such as an old link: the empty state, as the dashboard's DESIGN.md
// draws a screen that is nothing but a message, centred in the sheet between
// two Rule lines, its icon plain, its title the screen's, one sentence and
// an outlined link to the Catalog. It holds still as it opens, as every
// screen does (DESIGN.md's Motion, 9).
export function NotFoundPage() {
  return (
    <Empty className="border-y border-rule">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SignpostIcon aria-hidden="true" />
        </EmptyMedia>
        <h1 className="text-base font-semibold">Screen not found</h1>
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

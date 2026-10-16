import { ChevronLeftIcon } from 'lucide-react';
import type * as React from 'react';
import { Link, type To } from 'react-router';

// The way back to the screen above, written above a screen's title, with a
// chevron that points back in the reading direction.
function BackLink({ to, children }: { to: To; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="-ms-1 inline-flex min-h-control items-center gap-1 self-start pe-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      <ChevronLeftIcon aria-hidden="true" className="size-4 rtl:rotate-180" />
      {children}
    </Link>
  );
}

export { BackLink };

'use client';

import type { MouseEvent, ReactNode } from 'react';

// The way out of a confirmation confirmed in place, "Keep them" or "Keep
// mine" (DESIGN.md's Emptying the Build and Copy into my Build): a link to
// the page, which opens with the confirmation folded, so that it works
// before any script has loaded; with script it folds the disclosure it
// stands in, in place, and gives the keyboard's focus back to its summary.
export function FoldItAgain({
  href,
  testId,
  className,
  children,
}: {
  href: string;
  testId: string;
  className: string;
  children: ReactNode;
}) {
  function fold(event: MouseEvent<HTMLAnchorElement>) {
    const details = event.currentTarget.closest('details');
    if (details === null) return;
    event.preventDefault();
    details.open = false;
    details.querySelector('summary')?.focus();
  }

  return (
    <a href={href} data-testid={testId} onClick={fold} className={className}>
      {children}
    </a>
  );
}

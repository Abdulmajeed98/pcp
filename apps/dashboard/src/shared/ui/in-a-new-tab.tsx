import { ExternalLinkIcon } from 'lucide-react';
import type { ReactNode } from 'react';

// A link that opens another site in a new tab, and says so to a screen
// reader, with `inANewTab`, and by its mark.
export function InANewTab({
  href,
  inANewTab,
  children,
}: {
  href: string;
  inANewTab: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-control items-center gap-1 underline underline-offset-4 hover:decoration-2"
    >
      {children}
      <span className="sr-only">{inANewTab}</span>
      <ExternalLinkIcon aria-hidden="true" className="size-4" />
    </a>
  );
}

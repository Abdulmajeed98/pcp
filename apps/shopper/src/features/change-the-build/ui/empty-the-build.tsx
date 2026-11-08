'use client';

import { type MouseEvent, useRef } from 'react';

import { buttonVariants } from '@/shared/ui';

// Emptying the Build (DESIGN.md's Emptying the Build): at the sheet's foot,
// "Empty the Build", a cell of the Board, centred, is the summary of a
// disclosure, which works before any script has loaded. Opened, it says in
// Body large what it does and that nothing brings the Parts back, and offers
// two buttons side by side, or one above the other where their words do not
// both fit: "Remove all 8 Parts", in the Ink with the paper's colour, the
// confirmation, a plain form sent with POST to `/<language>/build/empty`;
// and "Keep them", a cell of the Board, which folds it again: with script in
// place, without it as a link to the Build page, which opens folded. It is
// the Build's one confirmation. Its space opens and folds as the filters'
// fold does.
export function EmptyTheBuild({
  action,
  buildAddress,
  words,
}: {
  action: string;
  buildAddress: string;
  words: { cell: string; warning: string; confirm: string; keep: string };
}) {
  const disclosure = useRef<HTMLDetailsElement>(null);

  function keep(event: MouseEvent<HTMLAnchorElement>) {
    const details = disclosure.current;
    if (details === null) return;
    event.preventDefault();
    details.open = false;
    details.querySelector('summary')?.focus();
  }

  return (
    <details
      ref={disclosure}
      data-testid="empty-the-build"
      className="unfolds-in-place mt-group text-center"
    >
      <summary
        className={buttonVariants({
          kind: 'board',
          className: 'mx-auto flex w-fit list-none [&::-webkit-details-marker]:hidden',
        })}
      >
        {words.cell}
      </summary>
      <div className="mx-auto grid max-w-[30rem] grid-cols-[minmax(0,1fr)] justify-items-center gap-4 pt-5">
        <p className="text-lg text-balance">{words.warning}</p>
        <form action={action} method="post" className="flex flex-wrap justify-center gap-2">
          <button
            type="submit"
            data-testid="empty-confirm"
            className={buttonVariants({ kind: 'ink' })}
          >
            {words.confirm}
          </button>
          <a
            href={buildAddress}
            data-testid="keep-them"
            onClick={keep}
            className={buttonVariants({ kind: 'board' })}
          >
            {words.keep}
          </a>
        </form>
      </div>
    </details>
  );
}

import type { ReactNode } from 'react';

// The words of a button that change in place (DESIGN.md's Motion 12): every
// label in one cell, so that the button holds the width of its widest words
// and nothing beside or under it moves (the No Snap Rule). The label shown
// is the one `showing` names; the others hold their room, hidden from sight
// and from readers, so that the button's name is the words it shows. With
// `swaps` the words cross-fade as they change, as Copy the link's do; a busy
// button's change at once.
export function HeldWords<Label extends string>({
  labels,
  showing,
  swaps = false,
}: {
  labels: Record<Label, ReactNode>;
  showing: Label;
  swaps?: boolean;
}) {
  return (
    <span className="held-words" data-swaps={swaps ? '' : undefined}>
      {(Object.entries(labels) as [Label, ReactNode][]).map(([label, words]) => (
        <span
          key={label}
          data-words={label}
          aria-hidden={label === showing ? undefined : 'true'}
        >
          {words}
        </span>
      ))}
    </span>
  );
}

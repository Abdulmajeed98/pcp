import { AlwaysEnglish } from '@pcp/ui';
import type * as React from 'react';

// A Part's details, as DESIGN.md draws a list of details: a row each,
// divided by Rule lines, the detail's name in Note Grey on the start side and
// its value beside it, two fifths and three fifths of the row, at the small
// size.
export function DetailRows({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <dl aria-label={label} className="divide-y divide-rule border-y border-rule text-sm">
      {children}
    </dl>
  );
}

export function DetailRow({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-4 py-3.5">
      <dt className="text-muted-foreground">{name}</dt>
      <dd className="min-w-0 wrap-break-word">{children}</dd>
    </div>
  );
}

// A Part's part numbers, in Geist Mono, left to right. Each word of each is
// kept whole on its line, as the number on a box is read whole, and wraps
// inside itself only when it is longer than the line: OpenDB writes some part
// numbers as several words, "Prime LC 240 ARGB 90RC0111-B0UAY0", which broke
// at a hyphen as one block (redesign ticket 08's break-ui).
export function PartNumbers({ partNumbers }: { partNumbers: readonly string[] }) {
  return (
    <AlwaysEnglish className="font-mono text-muted-foreground">
      {partNumbers.map((partNumber, index) => {
        const words = partNumber.trim().split(/\s+/);
        return (
          <span key={index}>
            {index > 0 && ' '}
            {words.map((word, at) => (
              <span key={at}>
                {at > 0 && ' '}
                <span className="inline-block max-w-full wrap-anywhere">
                  {word}
                  {at === words.length - 1 && index < partNumbers.length - 1 && ','}
                </span>
              </span>
            ))}
          </span>
        );
      })}
    </AlwaysEnglish>
  );
}

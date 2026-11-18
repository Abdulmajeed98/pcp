import { AlwaysEnglish, AsWritten } from '@pcp/ui';
import { cn } from 'cn';
import type { ComponentProps } from 'react';

// Text with no letter outside printable ASCII: the day and `.xlsx` of a
// downloaded Offer sheet's name, or any Latin word.
const latin = /^[\x21-\x7e]+$/;

// A file's name, such as the Offer sheet's "خشتەی ئۆفەرەکان 2026-11-18.xlsx",
// shown in its own direction with its last word isolated left to right when
// that word is Latin, the day and `.xlsx`, or else its extension alone, so
// that neither is reordered inside a Kurdish or an Arabic sentence (the
// dashboard's DESIGN.md, Typography; sheet ticket 03). It breaks anywhere
// rather than push its line sideways.
export function FileName({
  name,
  className,
  ...props
}: Omit<ComponentProps<'bdi'>, 'dir' | 'children'> & { name: string }) {
  const space = name.lastIndexOf(' ');
  const dot = name.lastIndexOf('.');
  const [start, end] =
    space > 0 && latin.test(name.slice(space + 1))
      ? [name.slice(0, space + 1), name.slice(space + 1)]
      : dot > 0
        ? [name.slice(0, dot), name.slice(dot)]
        : [name, ''];

  return (
    <AsWritten className={cn('wrap-anywhere', className)} {...props}>
      {start}
      {end !== '' && <AlwaysEnglish>{end}</AlwaysEnglish>}
    </AsWritten>
  );
}

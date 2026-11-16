'use client';

import type { FormEvent } from 'react';

import { useChangesInPlace } from './changes-in-place';
import { underlinedButton } from './underlined-action';

// Remove (DESIGN.md's A Category on the Build's sheet): a plain form, sent
// with POST to `/<language>/build/remove`, that takes one Part out of the
// Build, at the end of its line's controls, underlined words named for a
// screen reader by the Part, "Remove AMD Ryzen 5 7600X". Without script it
// is answered with the Build page anew, at the Part's Category. With script
// the line fades and folds as it is sent, never held back for a movement,
// and the keyboard's focus goes to the Category's place (`focusAfter`).
export function RemoveForm({
  action,
  part,
  line,
  focusAfter,
  label,
  children,
}: {
  action: string;
  part: string;
  line: string;
  focusAfter: string;
  label: string;
  children: string;
}) {
  const inPlace = useChangesInPlace();

  function sendInPlace(event: FormEvent<HTMLFormElement>) {
    if (inPlace === undefined) return;
    event.preventDefault();
    inPlace(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter, {
      line,
      focusAfter,
    });
  }

  return (
    <form action={action} method="post" onSubmit={sendInPlace}>
      <input type="hidden" name="part" value={part} />
      <button
        type="submit"
        aria-label={label}
        data-testid="remove"
        className={underlinedButton}
      >
        {children}
      </button>
    </form>
  );
}

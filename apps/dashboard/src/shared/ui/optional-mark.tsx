import type { ReactNode } from 'react';

// The mark of a detail a form lets the person leave out, beside its label:
// said in words, in the form's language, which the control names as part of
// its description, so a screen reader says it with the field. It is drawn as
// a Part's "Needed" mark is.
export function OptionalMark({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span
      id={id}
      className="rounded-sm bg-secondary px-1.5 text-sm font-medium text-secondary-foreground"
    >
      {children}
    </span>
  );
}

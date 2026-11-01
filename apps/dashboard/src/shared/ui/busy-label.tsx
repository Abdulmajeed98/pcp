import { cn } from 'cn';

// The words of a button whose action takes a moment: `label` while it is
// idle, `busyLabel` while its action is on its way (DESIGN.md's Buttons,
// Busy). Both are laid in the same cell, the one not said hidden, so that
// the button keeps the width of the longer and nothing beside it moves when
// the words change (the No Snap Rule). Only the words said are named to a
// screen reader.
export function BusyLabel({
  busy,
  label,
  busyLabel,
}: {
  busy: boolean;
  label: string;
  busyLabel: string;
}) {
  return (
    <span className="grid justify-items-center">
      <span
        aria-hidden={busy}
        className={cn('col-start-1 row-start-1', busy && 'invisible')}
      >
        {label}
      </span>
      <span
        aria-hidden={!busy}
        className={cn('col-start-1 row-start-1', !busy && 'invisible')}
      >
        {busyLabel}
      </span>
    </span>
  );
}

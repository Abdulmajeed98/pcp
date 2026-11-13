import { cn } from 'cn';
import Link from 'next/link';

// The picker's switch (DESIGN.md's The switch, The feel on a phone): a chip
// under the sheet's sentence, in sight on a phone without unfolding the
// filters, "Show the CPUs that are not compatible". Off, the Board with an empty
// square before its words; on, Print Green with Green's Ink and a tick, so
// that its state is in a mark as well as a colour, and its name for a
// screen reader says after its words that they are shown and that a tap
// hides them (`nameOn`, out of sight), so that its name holds what it shows
// (WCAG 2.5.3). It is a link to the same picker with the switch the other way,
// from its first page, so one tap shows them without script; with script
// the list is drawn again in place, shown printed, and the sheet's sentence
// says what changed. It takes a tap at once, its pressed ground and the
// press (Motion 8), and its words are not selected under a resting thumb.
export function TheSwitch({
  on,
  address,
  words,
  nameOn,
}: {
  on: boolean;
  // The same picker with the switch the other way.
  address: string;
  words: string;
  nameOn: string;
}) {
  return (
    <p className="mt-5 flex justify-center">
      <Link
        href={address}
        prefetch={false}
        data-testid="switch"
        data-on={on ? 'yes' : 'no'}
        className={cn(
          'pressable no-callout inline-flex min-h-control max-w-full cursor-pointer items-center gap-2.5 px-3.5 text-base',
          on
            ? 'bg-primary text-primary-foreground hover:bg-primary-pressed active:bg-primary-pressed'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary-pressed active:bg-secondary-pressed',
        )}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 shrink-0">
          {on ? (
            <path
              d="M3 8.5 L6.2 11.7 L13 4.8"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
            />
          ) : (
            <rect
              x="1.5"
              y="1.5"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            />
          )}
        </svg>
        <span className="min-w-0 wrap-break-word">{words}</span>
        {on && <span className="sr-only">. {nameOn}</span>}
      </Link>
    </p>
  );
}

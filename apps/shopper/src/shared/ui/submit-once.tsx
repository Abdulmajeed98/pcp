'use client';

import { cn } from 'cn';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { buttonVariants } from './button';
import { HeldWords } from './held-words';

// The pressed ground a busy button keeps, a step deeper than its own, as a
// press gives it (DESIGN.md's Buttons and cells).
const busyGrounds = {
  primary: 'data-busy:bg-primary-pressed',
  ink: 'data-busy:bg-muted-foreground',
  board: 'data-busy:bg-secondary-pressed',
} as const;

// A plain form's button that takes one tap (DESIGN.md's The feel on a phone,
// One tap, one Referral, and Motion 12): with script, from its first tap it
// says what it is doing in its words at once, "Sharing…", keeps its pressed
// ground and takes no other tap or Enter until the page is shown again, as
// when the Shopper comes back to it with the browser's back button, and then
// says its own words again. Its words lie in one cell, so that it holds the
// width of the wider. Without script it is a plain button, and the form is
// sent with each tap. It is the form's own button, so the form works before
// any script has loaded.
export function SubmitOnce({
  kind,
  words,
  className,
  testId,
  label,
}: {
  kind: keyof typeof busyGrounds;
  // Its words, and its words while busy; its idle words may carry a drawn
  // mark after them, as Send on WhatsApp's arrow.
  words: { idle: ReactNode; busy: string };
  className?: string;
  testId: string;
  // Its name for a screen reader, when its words alone do not say what it
  // acts on.
  label?: string;
}) {
  const button = useRef<HTMLButtonElement>(null);
  const sent = useRef(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const own = button.current;
    const form = own?.form;
    if (own === null || form === null || form === undefined) return;

    function once(event: SubmitEvent) {
      if (sent.current) {
        event.preventDefault();
        return;
      }
      if (event.defaultPrevented) return;
      sent.current = true;
      setBusy(true);
    }
    // A page shown again from the browser's cache is as the Shopper left it,
    // busy, and takes its taps again.
    function shownAgain(event: PageTransitionEvent) {
      if (!event.persisted) return;
      sent.current = false;
      setBusy(false);
    }
    // A form sent to a new tab, as Send on WhatsApp is, leaves its page in
    // its own tab, hidden while the new tab or the app it hands over to is
    // in front: the page is shown again when the Shopper comes back to it,
    // and then takes its taps again.
    let hiddenSinceSent = false;
    function seenAgain() {
      if (!sent.current) return;
      if (document.visibilityState === 'hidden') {
        hiddenSinceSent = true;
        return;
      }
      if (!hiddenSinceSent) return;
      hiddenSinceSent = false;
      sent.current = false;
      setBusy(false);
    }

    form.addEventListener('submit', once);
    window.addEventListener('pageshow', shownAgain);
    document.addEventListener('visibilitychange', seenAgain);
    return () => {
      form.removeEventListener('submit', once);
      window.removeEventListener('pageshow', shownAgain);
      document.removeEventListener('visibilitychange', seenAgain);
    };
  }, []);

  return (
    <button
      ref={button}
      type="submit"
      data-testid={testId}
      data-busy={busy ? '' : undefined}
      aria-busy={busy || undefined}
      aria-label={busy ? undefined : label}
      className={cn(
        buttonVariants({ kind }),
        busyGrounds[kind],
        'data-busy:pointer-events-none',
        className,
      )}
    >
      <HeldWords labels={words} showing={busy ? 'busy' : 'idle'} />
    </button>
  );
}

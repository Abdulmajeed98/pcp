'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  createContext,
  type ReactNode,
  startTransition,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
} from 'react';

import { type Held, leave, showWhatArrived, whatIsHeld } from '../lib/in-place';

// How a form on the Build page sends its change in place: the form, the
// button that sent it, and the line it takes out, if any, with the element
// the keyboard's focus goes to once that line, and its Remove, are gone.
type SendInPlace = (
  form: HTMLFormElement,
  submitter: HTMLElement | null,
  leaving?: { line: string; focusAfter: string },
) => void;

const InPlace = createContext<SendInPlace | undefined>(undefined);

// The way a form on the Build page sends its change in place, or none, for a
// form drawn elsewhere or before the page's script has loaded, which is then
// sent as it is, and answered with the Build page anew.
export function useChangesInPlace(): SendInPlace | undefined {
  return useContext(InPlace);
}

// The Build page's changes in place (DESIGN.md's When a movement plays, A
// change to the Build): with script, a quantity or a Remove is sent in the
// background, as the scheme switch sends its choice, and the page is drawn
// again from the server's answer, holding still but for what the change
// brought (Motion 11). The server's answer is a redirect, which is not
// followed: what matters of it is the cookie it writes. Without script each
// form is sent as it is, and answered with the Build page anew.
//
// A line the change takes out fades and folds as the form is sent, never
// holding the tap back; once the page is drawn again, what it gained opens
// its space and prints in, and each figure it altered settles again. The
// page is marked as drawn again, so that what it gains does not print as if
// the page had just opened. `drawnFor` is the Build the server drew the page
// for, which changes when a change is applied.
export function ChangesInPlace({
  drawnFor,
  children,
}: {
  drawnFor: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const container = useRef<HTMLDivElement>(null);
  const held = useRef<Held | undefined>(undefined);
  const focusAfter = useRef<string | undefined>(undefined);

  const send = useCallback<SendInPlace>(
    (form, submitter, leaving) => {
      const page = container.current;
      if (page === null) return;
      document.documentElement.setAttribute('data-drawn-again', '');
      focusAfter.current = leaving?.focusAfter;
      const lines =
        leaving === undefined
          ? []
          : [...page.querySelectorAll<HTMLElement>(`[data-line="${leaving.line}"]`)];
      const going = leave(lines);
      const sent = fetch(form.action, {
        method: 'POST',
        body: new FormData(form, submitter),
        redirect: 'manual',
      });

      void Promise.all([sent, going.done])
        .catch(() => going.cancel())
        .finally(() => {
          held.current = whatIsHeld(page);
          // A refusal the address said is the last change's, so a change
          // drawn again leaves it out of the address.
          startTransition(() => {
            if (query === '') router.refresh();
            else router.replace(pathname, { scroll: false });
          });
        });
    },
    [router, pathname, query],
  );

  // Before the page drawn again is painted.
  useLayoutEffect(() => {
    const before = held.current;
    if (before === undefined || container.current === null) return;
    held.current = undefined;
    showWhatArrived(container.current, before);
    // The Remove that had the focus is gone with its line: the focus goes to
    // its Category's place, rather than back to the top of the page.
    const target = focusAfter.current;
    focusAfter.current = undefined;
    if (target !== undefined && !container.current.contains(document.activeElement)) {
      document.getElementById(target)?.focus({ preventScroll: true });
    }
  }, [drawnFor]);

  return (
    <InPlace value={send}>
      <div ref={container} className="contents">
        {children}
      </div>
    </InPlace>
  );
}

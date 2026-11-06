'use client';

import type { Language } from '@pcp/i18n';
import { usePathname, useSearchParams } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { type Scheme, schemeAfter, schemes } from '@/shared/scheme';

import { choice } from './choice';
import { showTheScheme } from './show-the-scheme';

// The scheme switch (DESIGN.md's The scheme switch): named "Colours" from
// 48rem, with Light, Dark and Device, Device the first choice; on a phone, one
// button with a half-filled circle, 44 pixels square, that turns through
// Light, Dark and Device, its name saying the scheme now and the one a tap
// gives. The chosen one is marked as the current one.
//
// A choice is a button of a plain form, remembered in a cookie as the
// currency is: the server's answer writes it down, for a year, and returns
// the Shopper to the page they were on, which the server draws in the chosen
// scheme before the first paint, so that no page flashes the other. It works
// before any script has loaded. With script the scheme changes in place,
// every colour in one frame, and the same form is sent in the background, so
// that the server's answer still writes the choice down. The device's scheme
// follows the device.
//
// It is a component for the browser only because it asks for the address of
// the page that is shown, and changes the scheme in place. The server renders
// it as well, so the form is in the page as it arrives. The "not found"
// screen is the exception, because the browser draws that whole screen by
// script.
export function SchemeSwitch({
  language,
  current,
  words,
}: {
  language: Language;
  current: Scheme;
  words: {
    label: string;
    names: Record<Scheme, string>;
    // The phone's button's name while each scheme is shown, which says that
    // scheme and the one a tap gives.
    turn: Record<Scheme, string>;
  };
}) {
  const [shown, setShown] = useState(current);
  const query = useSearchParams().toString();
  const page = `${usePathname().replace(/^\/[^/]+/, '')}${query === '' ? '' : `?${query}`}`;
  const next = schemeAfter(shown);

  // With script, the choice is shown at once and sent without leaving the
  // page. The server's answer is a redirect, which is not followed: what
  // matters of it is the cookie it writes.
  function chooseInPlace(event: FormEvent<HTMLFormElement>) {
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const chosen = submitter instanceof HTMLButtonElement ? submitter.value : undefined;
    const scheme = schemes.find((each) => each === chosen);
    if (scheme === undefined) return;
    event.preventDefault();

    showTheScheme(scheme);
    setShown(scheme);
    const form = new FormData(event.currentTarget);
    form.set('scheme', scheme);
    void fetch(event.currentTarget.action, {
      method: 'POST',
      body: form,
      redirect: 'manual',
    }).catch(() => {
      // Not remembered: the colours hold until the page is left.
    });
  }

  return (
    // The address of `app/[locale]/scheme/route.ts`, which answers it.
    <form
      action={`/${language}/scheme`}
      method="post"
      aria-label={words.label}
      data-testid="scheme-switch"
      className="flex items-center"
      onSubmit={chooseInPlace}
    >
      <input type="hidden" name="page" value={page} />
      <span
        aria-hidden="true"
        className="hidden pe-1 text-sm text-muted-foreground md:inline"
      >
        {words.label}
      </span>
      <ul className="hidden md:flex">
        {schemes.map((scheme) => (
          <li key={scheme}>
            <button
              type="submit"
              name="scheme"
              value={scheme}
              aria-current={scheme === shown ? 'true' : undefined}
              data-chosen={scheme === shown ? '' : undefined}
              className={`${choice} no-callout`}
            >
              {words.names[scheme]}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="submit"
        name="scheme"
        value={next}
        aria-label={words.turn[shown]}
        data-testid="scheme-turn"
        data-scheme-now={shown}
        className="pressable no-callout inline-flex size-control cursor-pointer items-center justify-center text-foreground md:hidden"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="8.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" />
        </svg>
      </button>
    </form>
  );
}

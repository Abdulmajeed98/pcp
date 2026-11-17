'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { buttonVariants, HeldWords } from '@/shared/ui';

// How long "✓ Link copied" stays before Copy the link comes back (DESIGN.md's
// The link and Share the link).
const copiedFor = 2500;

// Share the link (DESIGN.md's The Shared Build page): one cell of the
// Board, 52 pixels tall and as wide as the piece it stands in, the slip's
// one action for the browser that holds the Build, and under the printed
// link on the sheet for a reader. It needs script, so it is not drawn
// without it, where the printed link is copied by hand.
//
// It is "Share the link" where the browser has a share sheet, and calls it
// in the tap itself, with nothing awaited before it, since a browser opens
// it only from a tap; closing the sheet says nothing. It is "Copy the link"
// where the browser has none: it copies the link and its words turn to
// "✓ Link copied" in place for 2.5 seconds, the button holding the width of
// its widest words, a second press copying again and keeping the words
// (Motion 12); where copying is refused, as on an address that is not HTTPS,
// the printed link stays to be copied by hand. A screen reader hears that
// the link was copied.
export function ShareTheLinkButton({
  link,
  words,
}: {
  link: string;
  words: { share: string; copy: string; copied: string };
}) {
  const way = useSyncExternalStore(nothingChanges, theBrowsersWay, () => 'share' as const);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function shareOrCopy() {
    if (way === 'share') {
      // Closing the share sheet, or a share the browser refuses, says
      // nothing: the printed link is still there.
      navigator.share({ url: link }).catch(() => undefined);
      return;
    }
    navigator.clipboard
      .writeText(link)
      .then(() => {
        clearTimeout(timer.current);
        setCopied(true);
        timer.current = setTimeout(() => setCopied(false), copiedFor);
      })
      .catch(() => undefined);
  }

  return (
    <>
      <button
        type="button"
        data-testid="share-the-link-button"
        data-way={way}
        onClick={shareOrCopy}
        className={buttonVariants({
          kind: 'board',
          className: 'w-full [@media(scripting:none)]:hidden',
        })}
      >
        <HeldWords
          swaps
          labels={{
            share: words.share,
            copy: words.copy,
            copied: (
              <>
                <TickDrawn />
                {words.copied}
              </>
            ),
          }}
          showing={way === 'share' ? 'share' : copied ? 'copied' : 'copy'}
        />
      </button>
      <output className="sr-only">{copied ? words.copied : ''}</output>
    </>
  );
}

// The way the browser shares a link: its own share sheet where it has one,
// or a copy. It does not change while the page is open; on the server, and
// in the page as the server sends it, the button says "Share the link".
function theBrowsersWay(): 'share' | 'copy' {
  return typeof navigator.share === 'function' ? 'share' : 'copy';
}

function nothingChanges(): () => void {
  return () => undefined;
}

// The tick of "✓ Link copied", drawn in the button's ink, never mirrored,
// hidden from readers, since the words beside it say the same; it prints in
// from its start edge as the words arrive (the theme's `held-words`).
function TickDrawn() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      data-tick=""
      className="shrink-0"
    >
      <path
        d="M3 8.5l3.2 3.2L13 4.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="square"
      />
    </svg>
  );
}

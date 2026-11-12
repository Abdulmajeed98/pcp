'use client';

import { useLayoutEffect } from 'react';

// A page come back to by back or forward is shown printed (DESIGN.md's When a
// movement plays). The browser shows such a page from its back-forward cache
// as it was left; when it draws it again instead, the document is marked
// before the first paint, so that no piece prints a second time.
//
// So is a page opened at an anchor, as a pick is answered with the Build page
// at the Category picked (`/en/build#cpu`): a page drawn again, shown
// printed, as an anchor's target always is. The theme shows the piece that
// holds the target printed (`:has(:target)`), but the browser may paint a
// streamed page before it has found its target, and that piece then began to
// print and snapped whole a frame later (builder ticket 09's films), so the
// document is marked drawn again before its first paint.
const markAReturn =
  "try{var n=performance.getEntriesByType('navigation')[0];if(n&&n.type==='back_forward')document.documentElement.setAttribute('data-returned','');if(location.hash.length>1)document.documentElement.setAttribute('data-drawn-again','')}catch(e){}";

// The line is sent in the head of the page as the server draws it, where the
// browser runs it before it draws anything. In the browser the component
// draws nothing: the line has already run, and React leaves a script it did
// not draw in the head alone. A page the browser draws by script, as the
// "not found" screen of an unknown Category, Part or Vendor is, arrives with
// no line, so the component marks it itself, after it is drawn and before it
// is painted.
export function MarkAReturn() {
  useLayoutEffect(() => {
    const [navigation] = performance.getEntriesByType('navigation');
    if (
      navigation instanceof PerformanceNavigationTiming &&
      navigation.type === 'back_forward'
    ) {
      document.documentElement.setAttribute('data-returned', '');
    }
    if (location.hash.length > 1) {
      document.documentElement.setAttribute('data-drawn-again', '');
    }
  }, []);

  if (typeof window !== 'undefined') return null;
  return <script dangerouslySetInnerHTML={{ __html: markAReturn }} />;
}

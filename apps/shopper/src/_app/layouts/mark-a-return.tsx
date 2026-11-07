'use client';

import { useLayoutEffect } from 'react';

// A page come back to by back or forward is shown printed (DESIGN.md's When a
// movement plays). The browser shows such a page from its back-forward cache
// as it was left; when it draws it again instead, the document is marked
// before the first paint, so that no piece prints a second time.
const markAReturn =
  "try{var n=performance.getEntriesByType('navigation')[0];if(n&&n.type==='back_forward')document.documentElement.setAttribute('data-returned','')}catch(e){}";

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
  }, []);

  if (typeof window !== 'undefined') return null;
  return <script dangerouslySetInnerHTML={{ __html: markAReturn }} />;
}

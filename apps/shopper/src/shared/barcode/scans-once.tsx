'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';

// A barcode that is scanned once (Motion 6): when it comes into view, its
// top about nine tenths of the way down the window, a 3-pixel line of Print
// Green crosses it from its start edge to its end edge, 700 ms at a constant
// speed, 400 ms after it is seen, and is gone at the end, past the edge that
// clips it. It runs to its end, once a page view. The theme's `scans` draws
// it; this, the page's script, says when. Nothing is held back: the bars are
// drawn whole from the first frame, and the line is decoration, hidden from
// readers. A page come back to by back or forward (`data-returned`) shows
// no line, nor does a page under reduced motion or with no script.
export function ScansOnce({ children }: { children: ReactNode }) {
  const watched = useRef<HTMLDivElement>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const element = watched.current;
    if (element === null) return;
    if (document.documentElement.hasAttribute('data-returned')) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setScanning(true);
        observer.disconnect();
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={watched} data-scan={scanning ? 'scanning' : undefined} className="scans">
      {children}
      <span aria-hidden="true" data-scan-line="" />
    </div>
  );
}

import { type ReactNode, useEffect, useState } from 'react';

// A note that arrives in a live region, such as the note after a Part
// Request is sent or resolved, or after an Offer is added. A screen reader
// announces what arrives in a live region already in the page, and reads a
// region that comes with its note as part of the page, unannounced; so a
// note shown with the screen it is on, as when the screen is drawn on the
// way back from a form, would not be announced (the code review of
// part-requests, its follow-ups).
//
// So the note is drawn at once, as Motion 6 says, but kept out of the
// accessibility tree, and out of reach of the keyboard, for two frames: the
// region holds nothing a screen reader reads while it is put into the page,
// and the note then arrives in it. Nothing is drawn again, so nothing moves.
// The region around it is the screen's own `output`, always in the page.
export function Announced({ children }: { children: ReactNode }) {
  const inThePage = useDrawnTwice();

  return (
    <div aria-hidden={inThePage ? undefined : true} inert={!inThePage}>
      {children}
    </div>
  );
}

// Whether two frames have been drawn since the component was put into the
// page: the first draws the region, the second lets the note into it.
function useDrawnTwice(): boolean {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setDrawn(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);
  return drawn;
}

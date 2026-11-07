import type { ReactNode } from 'react';

// The frame: what every Shopper page lies in, the "not found" screen among
// them. It is laid out for a phone 360 pixels wide first. A word too long for
// the screen is broken, so that it cannot make the page scroll sideways.
//
// Each page draws the frame's pieces itself, from the widgets layer, since
// what they hold is the page's: its header, the stub, or on the home page the
// card's top row, with the name slot and the three switches; and its footer,
// the back cover, with the credit to BuildCores OpenDB and the photographs
// the page shows.
export function Frame({ children }: { children: ReactNode }) {
  return (
    <div data-testid="frame" className="flex min-h-svh flex-col wrap-break-word">
      {children}
    </div>
  );
}

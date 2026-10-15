import type { ReactNode } from 'react';

// The frame: the part every screen of the Vendor portal shares. It is laid
// out for a phone 360 pixels wide first, and on a wider screen it gives the
// screen more room, up to a width that still reads well. A word too long for
// the screen is broken, so that it cannot make the page scroll sideways.
//
// It holds no header yet. The language switch arrives in it with ticket 07.
export function VendorPortalFrame({ children }: { children: ReactNode }) {
  return (
    <div
      data-testid="frame"
      className="mx-auto min-h-dvh w-full max-w-3xl px-4 py-4 wrap-break-word sm:px-6 sm:py-6"
    >
      <main>{children}</main>
    </div>
  );
}

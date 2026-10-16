import type { ReactNode } from 'react';

import { LanguageSwitch } from './language-switch';

// The frame: the part every screen of the Vendor portal shares. It is laid
// out for a phone 360 pixels wide first, and on a wider screen it gives the
// screen more room, up to a width that still reads well. A word too long for
// the screen is broken, so that it cannot make the page scroll sideways.
//
// Its header holds the language switch, on the end side: the right in
// English, and the left in Kurdish and Arabic.
export function VendorPortalFrame({ children }: { children: ReactNode }) {
  return (
    <div
      data-testid="frame"
      className="mx-auto min-h-dvh w-full max-w-3xl px-4 py-4 wrap-break-word sm:px-6 sm:py-6"
    >
      <header className="flex justify-end">
        <LanguageSwitch />
      </header>
      <main>{children}</main>
    </div>
  );
}

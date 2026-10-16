import { getLocale, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { Footer } from './footer';
import { LanguageSwitch } from './language-switch';

// The frame: the part every Shopper page shares, the "not found" screen
// among them. It is laid out for a phone 360 pixels wide first, and on a
// wider screen it gives the page more room, up to a width that still reads
// well. A word too long for the screen is broken, so that it cannot make the
// page scroll sideways.
//
// Its header holds the language switch, on the end side: the right in
// English, and the left in Kurdish and Arabic. Its footer holds the credit
// to BuildCores OpenDB, at the foot of the window when the page is short.
//
// It carries no logo and no name, which wait for the platform's name.
export async function Frame({ children }: { children: ReactNode }) {
  const [language, t] = await Promise.all([getLocale(), getTranslations('Frame')]);

  return (
    <div
      data-testid="frame"
      className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-4 wrap-break-word sm:px-6 sm:py-6"
    >
      <header className="flex justify-end">
        <LanguageSwitch current={language} label={t('languageSwitch')} />
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

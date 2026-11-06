import { directions } from '@pcp/i18n';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';

import { schemeIn } from '@/shared/scheme';

import '../styles/global.css';
import { Frame } from './frame';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('App');

  return { title: t('title') };
}

// The server sends a page with its language and its direction declared on
// the document, so a Kurdish or an Arabic page arrives right to left and
// nothing flashes. It names the scheme the Shopper chose with the switch, in
// `data-scheme`, which the look's colours follow, so that the page arrives in
// it and no page flashes the other; with the device's scheme chosen it names
// none, and the page follows the device. No script sets any of them. Every
// page is shown inside the frame.
//
// The "not found" screen is the exception. Next answers an address that
// matches no page with a bare document, and the browser draws this layout
// and that screen from it, by script.
export async function RootLayout({ children }: { children: ReactNode }) {
  const [language, scheme] = await Promise.all([
    getLocale(),
    cookies().then((sent) => schemeIn(sent)),
  ]);

  return (
    <html
      lang={language}
      dir={directions[language]}
      data-scheme={scheme === 'device' ? undefined : scheme}
    >
      <body>
        <Frame>{children}</Frame>
      </body>
    </html>
  );
}

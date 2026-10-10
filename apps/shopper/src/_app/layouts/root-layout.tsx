import { directions } from '@pcp/i18n';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import '../styles/global.css';
import { Frame } from './frame';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('App');

  return { title: t('title') };
}

// The server sends a page with its language and its direction declared on
// the document, so a Kurdish or an Arabic page arrives right to left and
// nothing flashes. No script sets either. Every page is shown inside the
// frame.
//
// The "not found" screen is the exception. Next answers an address that
// matches no page with a bare document, and the browser draws this layout
// and that screen from it, by script.
//
// next-intl's links ask its provider which language the page is in, on the
// server and in the browser alike. The provider would also hand the browser
// every message of that language, and is told to hand it none: a page reads
// its text on the server.
export async function RootLayout({ children }: { children: ReactNode }) {
  const language = await getLocale();

  return (
    <html lang={language} dir={directions[language]}>
      <body>
        <NextIntlClientProvider messages={null}>
          <Frame>{children}</Frame>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

import { directions } from '@pcp/i18n';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import '../styles/global.css';
import { Frame } from './frame';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('App');

  return { title: t('title') };
}

// The server sends every page with its language and its direction declared
// on the document, so a Kurdish or an Arabic page arrives right to left and
// nothing flashes. No script sets either. Every page is shown inside the
// frame.
export async function RootLayout({ children }: { children: ReactNode }) {
  const language = await getLocale();

  return (
    <html lang={language} dir={directions[language]}>
      <body>
        <Frame>{children}</Frame>
      </body>
    </html>
  );
}

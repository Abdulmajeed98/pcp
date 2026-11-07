import { directions } from '@pcp/i18n';
import type { Metadata, Viewport } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';

import { publicAddress } from '@/shared/config';
import { barColours, browsersBar, schemeIn } from '@/shared/scheme';

import '../styles/global.css';
import { Frame } from './frame';
import { MarkAReturn } from './mark-a-return';

// What every page's preview builds on: the Shopper app's public address,
// from which the addresses a page names are written, and the site's name,
// which a page with no title of its own takes.
export async function generateMetadata(): Promise<Metadata> {
  const site = await getTranslations('Site');

  return { metadataBase: new URL(publicAddress()), title: site('name') };
}

// The viewport every page is drawn in (DESIGN.md's The feel on a phone): the
// device's width, zoom never turned off, and the page under a phone's notch,
// which the pieces pad from. The browser's bar takes the colour at the top of
// the page, Sheet Paper under the stub, in the scheme the page is drawn in;
// the home page gives its own.
export async function generateViewport(): Promise<Viewport> {
  return {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    themeColor: browsersBar(barColours.sheetPaper, schemeIn(await cookies())),
  };
}

// The server sends a page with its language and its direction declared on
// the document, so a Kurdish or an Arabic page arrives right to left and
// nothing flashes. It names the scheme the Shopper chose with the switch, in
// `data-scheme`, which the look's colours follow, so that the page arrives in
// it and no page flashes the other; with the device's scheme chosen it names
// none, and the page follows the device. No script sets any of them; the
// scheme switch changes the scheme in place once its script runs, and a
// return is marked by one line in the head (`MarkAReturn`), so React is told
// not to mind either. Every page is shown inside the frame.
//
// The "not found" screen of an address that matches no route is drawn on
// the server too, by `global-not-found.tsx` (follow-up ticket 07). That of an
// unknown Category, Part or Vendor is the exception: Next answers a page that
// says it is not found with a bare document, and the browser draws this
// layout and that screen from it, by script.
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
      suppressHydrationWarning
    >
      <head>
        <MarkAReturn />
      </head>
      <body>
        <Frame>{children}</Frame>
      </body>
    </html>
  );
}

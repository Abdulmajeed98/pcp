import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { headers } from 'next/headers';

import {
  NotFoundPage,
  generateMetadata as previewOfTheNotFoundPage,
} from '@/_pages/not-found';
import { routing } from '@/shared/i18n';

import { generateMetadata as previewOfTheSite, RootLayout } from './root-layout';

// The language of an address that matches no route. Next knows no root
// parameter there, so it is the language next-intl's proxy found for the
// request and named in a header of it: the address's own, or, for an address
// with none, the one the proxy sent it on to. An address the proxy does not
// see, such as one for a file, carries none, and takes the Shopper app's
// first language.
async function languageOfTheRequest() {
  const named = (await headers()).get('X-NEXT-INTL-LOCALE');
  return hasLocale(routing.locales, named) ? named : routing.defaultLocale;
}

// The preview of that screen: the site's, as a layout gives a page, and the
// "not found" page's own over it.
export async function generateGlobalNotFoundMetadata(): Promise<Metadata> {
  setRequestLocale(await languageOfTheRequest());
  return { ...(await previewOfTheSite()), ...(await previewOfTheNotFoundPage()) };
}

// The "not found" screen of an address that matches no route, drawn on the
// server in the visitor's language, inside the frame as every page is, and
// answered with the status 404 (follow-up ticket 07). Next draws it with its
// experimental `global-not-found.js`, in place of every layout, so it draws
// the root layout itself.
export async function GlobalNotFound() {
  setRequestLocale(await languageOfTheRequest());

  return (
    <RootLayout>
      <NotFoundPage />
    </RootLayout>
  );
}

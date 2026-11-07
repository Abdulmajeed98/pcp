import type { Metadata } from 'next';

import {
  NotFoundPage,
  generateMetadata as previewOfTheNotFoundPage,
} from '@/_pages/not-found';

import { generateMetadata as previewOfTheSite, RootLayout } from './root-layout';

// The preview of that screen: the site's, as a layout gives a page, and the
// "not found" page's own over it.
export async function generateGlobalNotFoundMetadata(): Promise<Metadata> {
  return { ...(await previewOfTheSite()), ...(await previewOfTheNotFoundPage()) };
}

// The "not found" screen of an address that matches no route, drawn on the
// server in the visitor's language, inside the frame as every page is, and
// answered with the status 404 (follow-up ticket 07). Next draws it with its
// experimental `global-not-found.js`, in place of every layout, so it draws
// the root layout itself. There is no root parameter there, so the request
// set-up takes its language from next-intl's proxy (`request.ts`).
export function GlobalNotFound() {
  return (
    <RootLayout>
      <NotFoundPage />
    </RootLayout>
  );
}

import { type Language, shopperMessages } from '@pcp/i18n';
import type { Metadata } from 'next';
import { createTranslator } from 'next-intl';

import { buildPath } from '@/entities/build';
import { previewOf } from '@/shared/preview';

// The Build page's preview, in its language. The Build is the Shopper's own,
// read from their browser's cookie, so the page is marked for search engines
// not to index, and its preview is plain: its title, "Your Build", and a
// description that names no Part and no price, with the tags of every page
// (`previewOf`). A crawler, which sends no cookie, would only ever see an
// empty Build. A shared Build's preview is the `sharing` module's.
export function buildPreview({
  language,
  publicAddress,
}: {
  language: Language;
  publicAddress: string;
}): Metadata {
  const words = createTranslator({
    locale: language,
    messages: shopperMessages[language],
  });
  const site = words('Site.name');

  return {
    ...previewOf({
      language,
      path: buildPath,
      title: words('Preview.titleOfAPage', { page: words('Preview.build.title'), site }),
      description: words('Preview.build.description'),
      siteName: site,
      publicAddress,
    }),
    robots: { index: false },
  };
}

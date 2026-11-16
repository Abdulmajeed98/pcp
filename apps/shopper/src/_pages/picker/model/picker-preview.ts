import { type Language, shopperMessages } from '@pcp/i18n';
import type { Metadata } from 'next';
import { createTranslator } from 'next-intl';

import { type Category, pickerPath } from '@/entities/category';
import { previewOf } from '@/shared/preview';

// The picker's preview, in its language. The picker judges its Parts against
// the Build in the Shopper's cookie, so the page is marked for search
// engines not to index, and its preview is plain: its title, "Choose a CPU",
// naming the Category, and a description that names the Category and no
// price, with the tags of every page (`previewOf`). Its canonical address is
// the picker's own, whatever search, filters, switch or page its address
// holds.
export function pickerPreview({
  language,
  category,
  publicAddress,
}: {
  language: Language;
  category: Category;
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
      path: pickerPath(category),
      title: words('Preview.titleOfAPage', {
        page: words('BuildPage.choose', { category }),
        site,
      }),
      description: words('Preview.picker.description', { category }),
      siteName: site,
      publicAddress,
    }),
    robots: { index: false },
  };
}

import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';

import { publicAddress } from '@/shared/config';
import { previewOf } from '@/shared/preview';

// The "not found" page's preview, in its language: its title and its
// description, and Open Graph's tags. It answers an address that is no page,
// so it names no address as its own: no canonical address and no addresses
// in the other languages, which would tell a search engine that the address
// is a page. Next marks the answer as not to be indexed.
export async function generateMetadata(): Promise<Metadata> {
  const [language, t, site] = await Promise.all([
    getLocale(),
    getTranslations('Preview'),
    getTranslations('Site'),
  ]);
  const { alternates: _named, ...preview } = previewOf({
    language,
    path: '',
    title: t('titleOfAPage', { page: t('notFound.title'), site: site('name') }),
    description: t('notFound.description'),
    siteName: site('name'),
    publicAddress: publicAddress(),
  });
  const { url: _address, ...openGraph } = preview.openGraph ?? {};

  return { ...preview, openGraph };
}

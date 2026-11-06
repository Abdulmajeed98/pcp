import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { categoryOfTheAddress, categoryPath } from '@/entities/category';
import { publicAddress } from '@/shared/config';
import { previewOf } from '@/shared/preview';

// The address of a Category page, as Next hands it to the page: its language
// and the Category's name in it.
export interface CategoryPageParams {
  params: Promise<{ locale: string; category: string }>;
}

// A Category page's preview, in its language (BRW-5): its title names the
// Category, its description says what the page lists and names the
// Category, with no price, which a chat app's copy would keep showing after
// it changed, and the tags of every page (`previewOf`). Its canonical address
// is the Category page's own, whatever search or page the address holds: the
// list it names is the Category's. An unknown Category answers "not found".
export async function generateMetadata({ params }: CategoryPageParams): Promise<Metadata> {
  const category = categoryOfTheAddress((await params).category);
  if (category === undefined) notFound();

  const [language, t, site, categoryName] = await Promise.all([
    getLocale(),
    getTranslations('Preview'),
    getTranslations('Site'),
    getTranslations('Category'),
  ]);

  return previewOf({
    language,
    path: categoryPath(category),
    title: t('titleOfAPage', { page: categoryName(category), site: site('name') }),
    description: t('category.description', { category }),
    siteName: site('name'),
    publicAddress: publicAddress(),
  });
}

import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { categoryOfTheAddress } from '@/entities/category';
import { publicAddress } from '@/shared/config';

import { pickerPreview } from './picker-preview';

// The picker's address, as Next hands it to the page: its language and the
// Category's name in it.
export interface PickerPageParams {
  params: Promise<{ locale: string; category: string }>;
}

// The picker's preview (`pickerPreview`), in its language. It needs nothing
// from the API: it names the Category and no price. An unknown Category
// answers "not found".
export async function generateMetadata({ params }: PickerPageParams): Promise<Metadata> {
  const category = categoryOfTheAddress((await params).category);
  if (category === undefined) notFound();

  return pickerPreview({
    language: await getLocale(),
    category,
    publicAddress: publicAddress(),
  });
}

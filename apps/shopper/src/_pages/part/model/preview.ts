import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { publicAddress } from '@/shared/config';
import { chosenCurrency } from '@/shared/currency';

import { readThePartPage } from '../api/read-the-part-page';
import { partPreview } from './part-preview';

// The address of a Part page, as Next hands it to the page: its language and
// the Part's identifier.
export interface PartPageParams {
  params: Promise<{ locale: string; partId: string }>;
}

// A Part page's preview (`partPreview`), from the Part and its Offers as
// the page reads them, in its language. A Part that is not found answers
// "not found"; one the API did not answer keeps the site's own title.
export async function generateMetadata({ params }: PartPageParams): Promise<Metadata> {
  const [{ partId }, language, currency] = await Promise.all([
    params,
    getLocale(),
    chosenCurrency(),
  ]);
  const reading = await readThePartPage(partId, currency);
  if (reading.kind === 'not-found') notFound();
  if (reading.kind === 'not-read') return {};

  return partPreview({
    language,
    part: reading.part,
    offers: reading.offers,
    publicAddress: publicAddress(),
  });
}

import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { publicAddress } from '@/shared/config';
import { chosenCurrency } from '@/shared/currency';

import { readTheSharedBuildPage } from '../api/read-the-shared-build-page';
import { sharedBuildPreview } from './shared-build-preview';

// The address of a Shared Build page, as Next hands it to the page: its
// language and the Shared Build's identifier.
export interface SharedBuildPageParams {
  params: Promise<{ locale: string; sharedBuildId: string }>;
}

// A Shared Build page's preview (`sharedBuildPreview`), from the Parts the
// API answers of it, in its language. A Shared Build that is not found
// answers "not found"; one the API did not answer keeps the site's own title,
// and is still not indexed.
export async function generateMetadata({
  params,
}: SharedBuildPageParams): Promise<Metadata> {
  const [{ sharedBuildId }, language, currency] = await Promise.all([
    params,
    getLocale(),
    chosenCurrency(),
  ]);
  const read = await readTheSharedBuildPage(sharedBuildId, currency);
  if (read.kind === 'not-found') notFound();
  if (read.kind === 'not-read') return { robots: { index: false } };

  return sharedBuildPreview({
    language,
    shared: read.shared,
    parts: read.answer.parts,
    publicAddress: publicAddress(),
  });
}

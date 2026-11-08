import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';

import { publicAddress } from '@/shared/config';

import { buildPreview } from './build-preview';

// The Build page's preview (`buildPreview`), in its language. It needs
// nothing from the API: it names no Part and no price.
export async function generateMetadata(): Promise<Metadata> {
  return buildPreview({ language: await getLocale(), publicAddress: publicAddress() });
}

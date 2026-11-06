import type { Metadata, Viewport } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';

import { publicAddress } from '@/shared/config';
import { previewOf } from '@/shared/preview';
import { barColours, browsersBar, schemeIn } from '@/shared/scheme';

// The home page's preview, in its language: its title, a description that
// says what the platform is for, and the tags of every page (`previewOf`).
export async function generateMetadata(): Promise<Metadata> {
  const [language, t, site] = await Promise.all([
    getLocale(),
    getTranslations('Preview.home'),
    getTranslations('Site'),
  ]);

  return previewOf({
    language,
    path: '',
    title: t('title'),
    description: t('description'),
    siteName: site('name'),
    publicAddress: publicAddress(),
  });
}

// The home page's first screen is a dim photograph, so the browser's bar takes
// the Back Cover's colour, in the scheme the page is drawn in.
export async function generateViewport(): Promise<Viewport> {
  return {
    viewportFit: 'cover',
    themeColor: browsersBar(barColours.backCover, schemeIn(await cookies())),
  };
}

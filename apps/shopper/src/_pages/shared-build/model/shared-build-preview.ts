import type { BuildPartResponse, SharedBuildResponse } from '@pcp/api-client';
import { formatNumber, type Language, shopperMessages } from '@pcp/i18n';
import type { Metadata } from 'next';
import { createTranslator } from 'next-intl';

import { photoAddress } from '@/entities/part';
import { sharedBuildPath } from '@/entities/shared-build';
import { previewOf } from '@/shared/preview';

// A Shared Build page's preview, what WhatsApp and a search engine show of
// its link (success criterion 12, the sharing spec's The Shopper app), in the
// link's language, from the Shared Build and the Parts `GET v1/build`
// answers of it, in the catalog's order of Categories: its title names the
// Build by how many Parts it was shared with, each once whatever its
// quantity, as the slip counts them, a Part that has left the catalog since
// among them, so that a link whose Parts have all gone is not called a Build
// of none; its
// description names its CPU and its GPU when it has them, in English
// (LANG-3), so that a friend sent the link knows what PC it is; its image is
// the photo of its first Part with one, on the Shopper app's own address;
// and the tags of every page (`previewOf`). It is read by a crawler with no
// cookie, so it says nothing of the reader's own Build.
//
// It names no price, nor any city: a chat app keeps its copy of a preview,
// which would show a price after it changed (story 54), and the platform
// will reach beyond one city. A Shopper's Build is no page for a search
// engine, so the page is marked for search engines not to index (story 55).
export function sharedBuildPreview({
  language,
  shared,
  parts,
  publicAddress,
}: {
  language: Language;
  shared: Pick<SharedBuildResponse, 'id' | 'part'>;
  parts: readonly Pick<BuildPartResponse, 'category' | 'name' | 'photoPath'>[];
  publicAddress: string;
}): Metadata {
  const words = createTranslator({
    locale: language,
    messages: shopperMessages[language],
  });
  const site = words('Site.name');
  const count = shared.part.length;
  const cpu = parts.find((part) => part.category === 'cpu')?.name;
  const gpu = parts.find((part) => part.category === 'gpu')?.name;
  const holds =
    cpu !== undefined && gpu !== undefined
      ? 'both'
      : cpu !== undefined
        ? 'cpu'
        : gpu !== undefined
          ? 'gpu'
          : 'neither';
  const photo = parts.find((part) => part.photoPath !== null)?.photoPath ?? null;

  return {
    ...previewOf({
      language,
      path: sharedBuildPath(shared.id),
      title: words('Preview.titleOfAPage', {
        page: words('Preview.sharedBuild.title', {
          count,
          countText: formatNumber(count),
        }),
        site,
      }),
      description: words('Preview.sharedBuild.description', {
        holds,
        cpu: cpu ?? '',
        gpu: gpu ?? '',
      }),
      siteName: site,
      publicAddress,
      image: photo === null ? undefined : `${publicAddress}${photoAddress(photo)}`,
    }),
    robots: { index: false },
  };
}

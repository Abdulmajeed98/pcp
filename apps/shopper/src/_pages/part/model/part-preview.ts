import type {
  VisibleOfferResponse,
  VisiblePartWithSpecificationsResponse,
} from '@pcp/api-client';
import { formatNumber, type Language, shopperMessages } from '@pcp/i18n';
import type { Metadata } from 'next';
import { createTranslator } from 'next-intl';

import { partPath, photoAddress } from '@/entities/part';
import { previewOf } from '@/shared/preview';

// A Part page's preview, what WhatsApp and a search engine show of its link
// (BRW-5, success criterion 12), in the link's language: its title names the
// Part; its description names the Part, its manufacturer and its Category,
// and counts the Vendors that offer it, one Visible Offer each, so that a
// friend sent the link knows what it is and that it can be bought; Open
// Graph's image is the Part's photo, on the Shopper app's own address, when
// it has one (story 57); and the tags of every page (`previewOf`).
//
// It names no price, nor any city: a chat app keeps its copy of a preview,
// which would show a price after it changed (story 60), and the platform
// will reach beyond one city (the owner, 5 November 2026).
export function partPreview({
  language,
  part,
  offers,
  publicAddress,
}: {
  language: Language;
  part: Pick<
    VisiblePartWithSpecificationsResponse,
    'id' | 'category' | 'name' | 'manufacturer' | 'photoPath'
  >;
  offers: readonly VisibleOfferResponse[];
  publicAddress: string;
}): Metadata {
  const words = createTranslator({
    locale: language,
    messages: shopperMessages[language],
  });
  const site = words('Site.name');

  return previewOf({
    language,
    path: partPath(part.id),
    title: words('Preview.titleOfAPage', { page: part.name, site }),
    description: words('Preview.part.description', {
      part: part.name,
      manufacturer: part.manufacturer,
      category: part.category,
      count: offers.length,
      countText: formatNumber(offers.length),
    }),
    siteName: site,
    publicAddress,
    image:
      part.photoPath === null
        ? undefined
        : `${publicAddress}${photoAddress(part.photoPath)}`,
  });
}

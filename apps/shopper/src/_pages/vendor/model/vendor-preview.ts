import type { VisibleVendorResponse } from '@pcp/api-client';
import { type Language, sharedTerms, shopperMessages } from '@pcp/i18n';
import type { Metadata } from 'next';
import { createTranslator } from 'next-intl';

import { vendorPath } from '@/entities/vendor';
import { previewOf } from '@/shared/preview';

// A Vendor page's preview, what WhatsApp and a search engine show of its
// link (BRW-5), in the link's language: its title names the shop, as the
// Vendor wrote its name (LANG-4); its description names the shop and its
// city, the city in the page's language from the shared terms, and says
// what the page holds; and the tags of every page (`previewOf`). A shop has
// no picture of its own, so Open Graph is given none.
//
// It names no price, nor any count of Offers, which a chat app's copy would
// keep showing after they changed (story 60).
export function vendorPreview({
  language,
  vendor,
  publicAddress,
}: {
  language: Language;
  vendor: Pick<VisibleVendorResponse, 'id' | 'name' | 'city'>;
  publicAddress: string;
}): Metadata {
  const words = createTranslator({
    locale: language,
    messages: { ...sharedTerms[language], ...shopperMessages[language] },
  });
  const site = words('Site.name');

  return previewOf({
    language,
    path: vendorPath(vendor.id),
    title: words('Preview.titleOfAPage', { page: vendor.name, site }),
    description: words('Preview.vendor.description', {
      vendor: vendor.name,
      city: words(`City.${vendor.city}`),
    }),
    siteName: site,
    publicAddress,
  });
}

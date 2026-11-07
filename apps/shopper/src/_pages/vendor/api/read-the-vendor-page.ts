import type {
  VisibleOfferOfVendorPageResponse,
  VisibleVendorResponse,
} from '@pcp/api-client';
import { connection } from 'next/server';
import { cache } from 'react';

import { apiClient, namesNothingShown } from '@/shared/api';
import type { Currency } from '@/shared/currency';

// How many Offers a page of a Vendor's list holds: as many as a page of a
// Category's list, within the 12 to 24 a printed menu sheet holds.
export const offersAPage = 20;

// What a Vendor page shows: the visible Vendor, with one page of its Visible
// Offers in the chosen currency, or none when the API did not answer them;
// or that the Vendor is not found; or that the API did not answer at all.
export type VendorPageReading =
  | {
      kind: 'found';
      vendor: VisibleVendorResponse;
      offers: VisibleOfferOfVendorPageResponse | undefined;
    }
  | { kind: 'not-found' }
  | { kind: 'not-read' };

// What a Vendor page reads from the API, on the server, for each request,
// with no cache (the browse spec's The Shopper app): `GET
// v1/visible-vendors/{vendorId}` and one page of its Offers, `GET
// v1/visible-vendors/{vendorId}/offers` in the chosen currency, both at once.
// The page counts its pages from 1 and the API from 0. A Vendor that is
// deactivated or unknown, whichever read says so, is not found, and the page
// answers 404 (ACC-7). A Vendor the API did not answer at all cannot be read;
// Offers it did not answer are none, and the page says they cannot be read
// beside the Vendor's contact details. The page and its preview ask the same
// once.
export const readTheVendorPage = cache(
  async (
    vendorId: string,
    currency: Currency,
    page: number,
  ): Promise<VendorPageReading> => {
    // Rendering waits here for a request, so the page is never built ahead
    // nor kept: prices change by the hour and depend on the Shopper's cookie,
    // and a deactivated Vendor's page disappears at once.
    await connection();
    const api = apiClient();

    const [vendor, offers] = await Promise.all([
      api.readVisibleVendor({ path: { vendorId }, cache: 'no-store' }),
      api.listVisibleOffersOfVendor({
        path: { vendorId },
        query: { currency, page: page - 1, size: offersAPage },
        cache: 'no-store',
      }),
    ]);

    if (
      namesNothingShown(vendor.response?.status) ||
      namesNothingShown(offers.response?.status)
    ) {
      return { kind: 'not-found' };
    }
    if (vendor.data === undefined) return { kind: 'not-read' };
    return { kind: 'found', vendor: vendor.data, offers: offers.data };
  },
);

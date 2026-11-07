import type {
  PlatformFiguresResponse,
  VisibleOfferResponse,
  VisiblePartWithSpecificationsResponse,
} from '@pcp/api-client';
import { connection } from 'next/server';
import { cache } from 'react';

import { apiClient, namesNothingShown } from '@/shared/api';
import type { Currency } from '@/shared/currency';

// What a Part page shows: the Visible Part with its specifications, its
// Visible Offers in OFF-11's order with their Shown Prices in the chosen
// currency, and the platform's figures, for the slip's Platform Rate; or
// that the Part is not found; or that the API did not answer.
export type PartPageReading =
  | {
      kind: 'found';
      part: VisiblePartWithSpecificationsResponse;
      offers: VisibleOfferResponse[];
      figures: PlatformFiguresResponse | undefined;
    }
  | { kind: 'not-found' }
  | { kind: 'not-read' };

// What a Part page reads from the API, on the server, for each request, in
// the chosen currency, with no cache (the browse spec's The Shopper app):
// `GET v1/visible-parts/{partId}`, `GET v1/parts/{partId}/offers` and the
// platform's figures, all at once. A Part that is not visible, an unknown
// one, and a visible one whose Offers are gone by the time they are asked
// for are not found, and the page answers 404. A Part or Offers the API did
// not answer at all cannot be read; figures it did not answer are none, and
// the slip leaves the rate out. The page and its preview ask the same once.
export const readThePartPage = cache(
  async (partId: string, currency: Currency): Promise<PartPageReading> => {
    // Rendering waits here for a request, so the page is never built ahead
    // nor kept: prices change by the hour and depend on the Shopper's cookie.
    await connection();
    const api = apiClient();

    const [part, offers, figures] = await Promise.all([
      api.readVisiblePart({ path: { partId }, cache: 'no-store' }),
      api.listVisibleOffersOfPart({
        path: { partId },
        query: { currency },
        cache: 'no-store',
      }),
      api.readPlatformFigures({ cache: 'no-store' }),
    ]);

    if (
      namesNothingShown(part.response?.status) ||
      namesNothingShown(offers.response?.status)
    ) {
      return { kind: 'not-found' };
    }
    if (part.data === undefined || offers.data === undefined) return { kind: 'not-read' };
    if (offers.data.length === 0) return { kind: 'not-found' };
    return { kind: 'found', part: part.data, offers: offers.data, figures: figures.data };
  },
);

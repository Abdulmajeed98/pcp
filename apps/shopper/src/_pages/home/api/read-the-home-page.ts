import type {
  PlatformFiguresResponse,
  VisibleOfferResponse,
  VisiblePartResponse,
} from '@pcp/api-client';
import { connection } from 'next/server';

import { categories } from '@/entities/category';
import { apiClient } from '@/shared/api';
import type { Currency } from '@/shared/currency';

import { type FirstPage, thePlatesPart } from '../model/the-plates-part';

// What the home page reads from the API, on the server, for each request, in
// the chosen currency (DESIGN.md's The home page): the first page of each of
// the eight Categories' lists, for its count of Visible Parts and its first
// Part, one request a Category, all at once; the Offers of the one Part on
// the plate, for its slip; and the platform's figures. A read the API does
// not answer, or refuses, is nothing, as the API's client answers both with
// no data, and the page shows what it has: each figure only where the API
// answers it, and the eight Categories, which need nothing from the API.
export interface HomePageReading {
  firstPages: FirstPage[];
  plate:
    | { part: VisiblePartResponse; offers: VisibleOfferResponse[] | undefined }
    | undefined;
  figures: PlatformFiguresResponse | undefined;
}

export async function readTheHomePage(currency: Currency): Promise<HomePageReading> {
  // Rendering waits here for a request, so the page is never built ahead,
  // when the app is built and no API runs, nor kept: prices change by the
  // hour and depend on the Shopper's cookie.
  await connection();
  const api = apiClient();

  const [firstPages, figures] = await Promise.all([
    Promise.all(
      categories.map(async (category): Promise<FirstPage> => {
        const { data } = await api.listVisibleParts({ query: { category, currency } });
        return { category, page: data };
      }),
    ),
    api.readPlatformFigures().then(({ data }) => data),
  ]);

  const part = thePlatesPart(firstPages);
  if (part === undefined) return { firstPages, plate: undefined, figures };

  const { data: offers } = await api.listVisibleOffersOfPart({
    path: { partId: part.id },
    query: { currency },
  });
  return { firstPages, plate: { part, offers }, figures };
}

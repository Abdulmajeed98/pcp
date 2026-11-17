import type { BuildResponse, SharedBuildResponse } from '@pcp/api-client';
import { connection } from 'next/server';
import { cache } from 'react';

import { apiClient, namesNothingShown } from '@/shared/api';
import type { Currency } from '@/shared/currency';

// What the Shared Build page read: the Shared Build, its frozen `part`
// values and when it was shared, with the API's answer of those values
// today and the moment it was read, which the page counts the days since it
// was shared from; that no Shared Build has the identifier; or nothing, when
// the API did not answer.
export type SharedBuildRead =
  | { kind: 'read'; shared: SharedBuildResponse; answer: BuildResponse; readAt: Date }
  | { kind: 'not-found' }
  | { kind: 'not-read' };

// What the Shared Build page reads from the API, on the server, for each
// request, with no cache (the sharing spec's The Shopper app): the Shared
// Build, `GET v1/shared-builds/{id}`, then `GET v1/build` with its `part`
// values in the chosen currency, so that its prices, both price views, its
// outcomes, its status and its power draw are today's, worked out once by
// the API as a Build page's are (SHR-2). An identifier that names no Shared
// Build, and text that is not one, are not found, and the page answers 404.
// A Build the API refuses is read as not read: a Shared Build was read
// within the API's rules when it was stored. The page and its preview ask
// the same once.
export const readTheSharedBuildPage = cache(
  async (sharedBuildId: string, currency: Currency): Promise<SharedBuildRead> => {
    // Rendering waits here for a request, so the page is never built ahead
    // nor kept: its prices change by the hour.
    await connection();
    const api = apiClient();

    const shared = await api.readSharedBuild({
      path: { sharedBuildId },
      cache: 'no-store',
    });
    if (namesNothingShown(shared.response?.status)) return { kind: 'not-found' };
    if (shared.data === undefined) return { kind: 'not-read' };

    const read = await api.readBuild({
      query: { currency, part: shared.data.part },
      cache: 'no-store',
    });
    if (read.data === undefined) return { kind: 'not-read' };
    return { kind: 'read', shared: shared.data, answer: read.data, readAt: new Date() };
  },
);

import { connection } from 'next/server';
import { cache } from 'react';

import { readASharedBuild, type SharedBuildRead } from '@/shared/api';
import type { Currency } from '@/shared/currency';

// What the Shared Build page reads from the API, on the server, for each
// request, with no cache (the sharing spec's The Shopper app): the Shared
// Build and then its Build in the chosen currency (`readASharedBuild`), so
// that its prices, both price views, its outcomes, its status and its power
// draw are today's, worked out once by the API as a Build page's are
// (SHR-2). An identifier that names no Shared Build, and text that is not
// one, are not found, and the page answers 404. The page and its preview
// ask the same once.
export const readTheSharedBuildPage = cache(
  async (sharedBuildId: string, currency: Currency): Promise<SharedBuildRead> => {
    // Rendering waits here for a request, so the page is never built ahead
    // nor kept: its prices change by the hour.
    await connection();
    return readASharedBuild(sharedBuildId, currency);
  },
);

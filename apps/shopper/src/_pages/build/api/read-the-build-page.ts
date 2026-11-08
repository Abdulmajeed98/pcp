import type { BuildResponse } from '@pcp/api-client';
import { connection } from 'next/server';

import { type Build, partValuesOf } from '@/entities/build';
import { apiClient } from '@/shared/api';
import type { Currency } from '@/shared/currency';

// What the Build page reads from the API, on the server, for each request,
// in the chosen currency, with no cache: `GET v1/build` with the Build the
// Shopper's cookie holds as its `part`. The browser never calls the API. A
// Build the API did not answer cannot be read, and its cookie is left as it
// is.
export async function readTheBuildPage(
  build: Build,
  currency: Currency,
): Promise<BuildResponse | undefined> {
  // Rendering waits here for a request, so the page is never built ahead
  // nor kept: it is the Shopper's own, and its prices change by the hour.
  await connection();
  const answer = await apiClient().readBuild({
    query: { currency, part: partValuesOf(build) },
    cache: 'no-store',
  });
  return answer.data;
}

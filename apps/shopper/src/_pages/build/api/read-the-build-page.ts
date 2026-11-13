import type { BuildResponse } from '@pcp/api-client';
import { connection } from 'next/server';

import { type Build, partValuesOf } from '@/entities/build';
import { apiClient, refusesTheBuild } from '@/shared/api';
import type { Currency } from '@/shared/currency';

// What the Build page read of the Build: the API's answer; that the API
// refuses the Build its cookie holds, as a cookie edited by hand can make it
// (`refusesTheBuild`); or nothing, when the API did not answer it.
export type BuildRead =
  | { kind: 'read'; answer: BuildResponse }
  | { kind: 'refused' }
  | { kind: 'not-read' };

// What the Build page reads from the API, on the server, for each request,
// in the chosen currency, with no cache: `GET v1/build` with the Build the
// Shopper's cookie holds as its `part`. The browser never calls the API. The
// cookie is left as it is whatever the API answers.
export async function readTheBuildPage(
  build: Build,
  currency: Currency,
): Promise<BuildRead> {
  // Rendering waits here for a request, so the page is never built ahead
  // nor kept: it is the Shopper's own, and its prices change by the hour.
  await connection();
  const { data, error, response } = await apiClient().readBuild({
    query: { currency, part: partValuesOf(build) },
    cache: 'no-store',
  });
  if (data !== undefined) return { kind: 'read', answer: data };
  return refusesTheBuild({ status: response?.status, error })
    ? { kind: 'refused' }
    : { kind: 'not-read' };
}

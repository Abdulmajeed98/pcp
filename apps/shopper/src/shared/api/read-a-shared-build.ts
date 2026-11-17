import type { BuildResponse, Currency, SharedBuildResponse } from '@pcp/api-client';

import { apiClient } from './api-client';
import { namesNothingShown } from './names-nothing-shown';

// A Shared Build as the Shopper app reads it: the Shared Build, its frozen
// `part` values and when it was shared, the day and the calendar days since
// as the API counts them, with the API's answer of those values today; that
// no Shared Build has the identifier; or nothing, when the API did not
// answer.
export type SharedBuildRead =
  | { kind: 'read'; shared: SharedBuildResponse; answer: BuildResponse }
  | { kind: 'not-found' }
  | { kind: 'not-read' };

// Reads a Shared Build on the server, with no cache (the sharing spec's The
// Shopper app): `GET v1/shared-builds/{id}`, then `GET v1/build` with its
// `part` values in the currency given, so that its Parts, prices, views,
// outcomes, status and power draw are today's, worked out once by the API.
// An identifier that names no Shared Build, and text that is not one, are
// not found. A Build the API refuses is read as not read: a Shared Build was
// read within the API's rules when it was stored. The Shared Build page
// reads it so, and so does its copy, which keeps the Parts the API still
// answers.
export async function readASharedBuild(
  sharedBuildId: string,
  currency: Currency,
): Promise<SharedBuildRead> {
  const api = apiClient();
  const shared = await api.readSharedBuild({ path: { sharedBuildId }, cache: 'no-store' });
  if (namesNothingShown(shared.response?.status)) return { kind: 'not-found' };
  if (shared.data === undefined) return { kind: 'not-read' };

  const read = await api.readBuild({
    query: { currency, part: shared.data.part },
    cache: 'no-store',
  });
  if (read.data === undefined) return { kind: 'not-read' };
  return { kind: 'read', shared: shared.data, answer: read.data };
}

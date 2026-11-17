import { type Build, partValuesOf } from '@/entities/build';
import { apiClient, refusesTheBuild, theApisErrors } from '@/shared/api';

// What sharing a Build came to: the Shared Build that holds it, stored now
// or by an earlier share of the same Build; a Build the API refuses, which
// only a cookie edited by hand makes; a Build with no Part the catalog
// holds, which the API refuses as `empty`; or nothing, when the API did not
// answer.
export type ShareOutcome =
  | { kind: 'shared'; sharedBuildId: string }
  | { kind: 'refused' }
  | { kind: 'empty' }
  | { kind: 'not-shared' };

// Shares a Build on the server, for the share form (`POST v1/shared-builds`,
// the sharing spec's The API): the Build as the API takes it, `part`, which
// the API reads as `GET v1/build` does, leaving out a Part the catalog does
// not hold, and stores as a Shared Build, or answers the Shared Build an
// earlier share of the same Build stored, so the Shopper app keeps no record
// of what it has shared. The browser never calls the API.
export async function shareABuild(build: Build): Promise<ShareOutcome> {
  const { data, error, response } = await apiClient().shareBuild({
    body: { part: partValuesOf(build) },
  });
  if (data !== undefined) return { kind: 'shared', sharedBuildId: data.id };
  if (!refusesTheBuild({ status: response?.status, error })) return { kind: 'not-shared' };
  const empty = theApisErrors(error).some(
    (each) => each.additionalInformation?.reason === 'empty',
  );
  return empty ? { kind: 'empty' } : { kind: 'refused' };
}

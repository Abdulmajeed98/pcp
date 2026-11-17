import { type Build, copyOfTheSharedBuild } from '@/entities/build';
import { apiClient, namesNothingShown } from '@/shared/api';
import { chosenCurrency } from '@/shared/currency';

// What a copy of a Shared Build can be: the Build it writes; nothing, for a
// Shared Build whose Parts have all left the catalog; not found, for an
// identifier that names no Shared Build; or not read, when the API did not
// answer.
export type ToCopy =
  | { kind: 'copy'; build: Build }
  | { kind: 'nothing' }
  | { kind: 'not-found' }
  | { kind: 'not-read' };

// The Build a copy writes, read on the server for each copy, with no cache
// (the sharing spec's The Shopper app): the Shared Build's frozen `part`
// values (`GET v1/shared-builds/{id}`), then the Parts the catalog still
// holds of them (`GET v1/build`), each under the Category the API answers it
// in, so that a Part that has left the catalog is left out of the copy.
export async function readASharedBuildToCopy(sharedBuildId: string): Promise<ToCopy> {
  const api = apiClient();
  const shared = await api.readSharedBuild({ path: { sharedBuildId }, cache: 'no-store' });
  if (namesNothingShown(shared.response?.status)) return { kind: 'not-found' };
  if (shared.data === undefined) return { kind: 'not-read' };

  const read = await api.readBuild({
    query: { currency: await chosenCurrency(), part: shared.data.part },
    cache: 'no-store',
  });
  if (read.data === undefined) return { kind: 'not-read' };
  const build = copyOfTheSharedBuild(shared.data.part, read.data.parts);
  return build.length === 0 ? { kind: 'nothing' } : { kind: 'copy', build };
}

import { type Build, copyOfTheSharedBuild } from '@/entities/build';
import { readASharedBuild } from '@/shared/api';
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

// The Build a copy writes, read on the server for each copy, with no cache,
// as the Shared Build page reads it (`readASharedBuild`): the Shared Build's
// frozen `part` values, then the Parts the catalog still holds of them, each
// under the Category the API answers it in, so that a Part that has left the
// catalog is left out of the copy.
export async function readASharedBuildToCopy(sharedBuildId: string): Promise<ToCopy> {
  const read = await readASharedBuild(sharedBuildId, await chosenCurrency());
  if (read.kind !== 'read') return read;
  const build = copyOfTheSharedBuild(read.shared.part, read.answer.parts);
  return build.length === 0 ? { kind: 'nothing' } : { kind: 'copy', build };
}

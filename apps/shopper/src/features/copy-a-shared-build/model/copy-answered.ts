import type { Language } from '@pcp/i18n';

import { buildAddress } from '@/entities/build';
import { sharedBuildAddress } from '@/entities/shared-build';

// Why copying a Shared Build was refused: the API did not answer, so the
// Parts it still holds could not be read (DESIGN.md's Copy into my Build).
export type CopyRefusal = 'notCopied';

// The address a copy is answered with, 303, as a change to the Build is: the
// Build page, in the form's language, from its top, opened anew, so that its
// sheets print and the Shopper sees a new Build has arrived (Motion 12); or,
// for a refused copy, the Shared Build page again with its reason in the
// address, so that the page says it under the copy, with script and without.
export function addressAfterACopy(
  language: Language,
  sharedBuildId: string,
  refused?: CopyRefusal,
): string {
  if (refused === undefined) return buildAddress(language);
  return `${sharedBuildAddress(language, sharedBuildId)}?${new URLSearchParams({ refused }).toString()}`;
}

// Why a copy was refused, as the Shared Build page reads it from its
// address, or nothing for what it does not know.
export function refusedCopyIn(query: {
  get(name: string): string | null;
}): CopyRefusal | undefined {
  return query.get('refused') === 'notCopied' ? 'notCopied' : undefined;
}

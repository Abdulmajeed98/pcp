import type { Language } from '@pcp/i18n';

import { buildAddress } from '@/entities/build';
import { addressWithARefusal, refusalIn } from '@/shared/lib';

// Why sharing a Build was refused (DESIGN.md's The share button): the API
// did not answer (`notShared`); the API refuses the Build its cookie holds,
// which only a cookie edited by hand makes (`notReadable`); or the Build
// holds no Part the catalog still holds, so there is nothing to share
// (`nothingToShare`), which the API answers as `empty` and an empty cookie
// is refused as before it is sent.
export type ShareRefusal = 'notShared' | 'notReadable' | 'nothingToShare';

const shareRefusals: readonly ShareRefusal[] = [
  'notShared',
  'notReadable',
  'nothingToShare',
];

// The address a refused share is answered with, 303, as a change past the
// limits is: the Build page, in the form's language, from its top, its
// reason in the address, so that the page says it under the share button,
// with script and without.
export function addressAfterARefusedShare(
  language: Language,
  refused: ShareRefusal,
): string {
  return addressWithARefusal(buildAddress(language), { refused });
}

// Why a share was refused, as the Build page reads it from its address, or
// nothing: a reason it does not know, as a change's refusal or an address
// changed by hand, says nothing of a share.
export function refusedShareIn(query: {
  get(name: string): string | null;
}): ShareRefusal | undefined {
  return refusalIn(query, shareRefusals);
}

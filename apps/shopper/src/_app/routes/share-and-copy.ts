import { cookies } from 'next/headers';

import { buildIn, rememberTheBuild, writeTheBuild } from '@/entities/build';
import { sharedBuildAddress } from '@/entities/shared-build';
import { addressAfterACopy } from '@/features/copy-a-shared-build';
import { addressAfterARefusedShare } from '@/features/share-a-build';

import { readASharedBuildToCopy } from '../api/read-a-shared-build-to-copy';
import { readTheBuildToChange } from '../api/read-the-build-to-change';
import { shareABuild } from '../api/share-a-build';
import { answerAForm } from './answer-a-form';

// `POST /<language>/build/share`, Share this Build (SHR-1, SHR-4): the Build
// the browser's cookie holds, as the catalog holds it, which forgets the
// Parts it no longer holds, as a change to the Build does
// (`readTheBuildToChange`), is shared, and the answer sends the Shopper to
// its Shared Build page, in the form's language, whose address is the link.
// Sharing an unchanged Build again finds the same Shared Build, so it gives
// the same link. A share refused comes back to the Build page with its
// reason in the address: an empty Build, or one whose Parts have all left
// the catalog, has nothing to share; a Build the API refuses cannot be read;
// and an API that does not answer could not share it just now. When the
// catalog no longer holds a Part, the cookie forgets it, so that the
// browser's Build is the one shared. `answerAForm` says how the answer is
// made.
export const shareTheBuild = answerAForm(async (language) => {
  const kept = buildIn(await cookies());
  const build = await readTheBuildToChange(kept);
  const forget =
    writeTheBuild(build) === writeTheBuild(kept)
      ? undefined
      : (response: Parameters<typeof rememberTheBuild>[0]) =>
          rememberTheBuild(response, build);
  if (build.length === 0) {
    return {
      address: addressAfterARefusedShare(language, 'nothingToShare'),
      write: forget,
    };
  }

  const shared = await shareABuild(build);
  switch (shared.kind) {
    case 'shared':
      return { address: sharedBuildAddress(language, shared.sharedBuildId), write: forget };
    case 'empty':
      return {
        address: addressAfterARefusedShare(language, 'nothingToShare'),
        write: forget,
      };
    case 'refused':
      return { address: addressAfterARefusedShare(language, 'notReadable') };
    default:
      return { address: addressAfterARefusedShare(language, 'notShared') };
  }
});

// `POST /<language>/builds/<sharedBuildId>/copy`, Copy into my Build
// (SHR-3): the Shared Build, as far as the catalog still holds its Parts, is
// written into the browser's cookie in place of its own Build, which its
// confirmation asked about first, and the answer sends the Shopper to the
// Build page from its top, opened anew, to change it there. The Shared Build
// itself never changes. A copy the API does not answer comes back to the
// Shared Build page with its reason in the address; one of a Shared Build
// that does not exist, or whose Parts have all left the catalog, comes back
// to its page, which says so, and the cookie is left as it is.
export const copyASharedBuild = answerAForm<{ sharedBuildId: string }>(
  async (language, _form, { sharedBuildId }) => {
    const toCopy = await readASharedBuildToCopy(sharedBuildId);
    switch (toCopy.kind) {
      case 'copy':
        return {
          address: addressAfterACopy(language, sharedBuildId),
          write: (response) => rememberTheBuild(response, toCopy.build),
        };
      case 'not-read':
        return { address: addressAfterACopy(language, sharedBuildId, 'notCopied') };
      default:
        return { address: sharedBuildAddress(language, sharedBuildId) };
    }
  },
);

import { Either } from 'effect';

// Why a text was not taken as an Instagram name.
export type InstagramNameRefusal = 'tooLong' | 'notAnInstagramName';

// Instagram's rule for a name: Latin letters, digits, dots and underscores,
// at most 30 of them.
const instagramName = /^[a-z0-9._]+$/;
const longestInstagramName = 30;

// The address of an Instagram profile, with or without https:// and www. or
// m., with a closing slash, and with the query or the fragment that a shared
// link may carry. The name is what is left between the host and the end.
const profileAddress =
  /^(?:https?:\/\/)?(?:(?:www|m)\.)?instagram\.com\/([^/?#]*)\/?(?:[?#].*)?$/i;

// The Instagram name in a text as the Admin or a Vendor types or pastes it,
// bare and in lower case, as Instagram treats names. An @ before it, or a
// profile's address around it, is taken off, and what is left has to follow
// Instagram's rule.
export function readInstagramName(
  typed: string,
): Either.Either<string, InstagramNameRefusal> {
  const trimmed = typed.trim();
  const bare = (
    profileAddress.exec(trimmed)?.[1] ?? trimmed.replace(/^@/, '')
  ).toLowerCase();

  if (!instagramName.test(bare)) return Either.left('notAnInstagramName');
  if (bare.length > longestInstagramName) return Either.left('tooLong');
  return Either.right(bare);
}

import type { Language } from '@pcp/i18n';

// The part of a Shared Build page's address after its language, as its
// preview names it in every language: `/builds/<sharedBuildId>`. It names
// the Shared Build by its identifier alone, a random UUID that cannot be
// guessed, and must keep working for as long as the platform runs, since
// links to it sit in people's chats (ADR-0014).
export function sharedBuildPath(sharedBuildId: string): string {
  return `/builds/${sharedBuildId}`;
}

// The Shared Build page's address, in a language:
// `/<language>/builds/<sharedBuildId>`. Sharing is answered with it in the
// language of the Build page it was sent from, so the link carries its
// sender's language (ADR-0008).
export function sharedBuildAddress(language: Language, sharedBuildId: string): string {
  return `/${language}${sharedBuildPath(sharedBuildId)}`;
}

// A Shared Build's link, the one the Shopper sends: its page's address on
// the Shopper app's public address (`SHOPPER_PUBLIC_URL`), which a chat app
// must be able to reach for its preview.
export function sharedBuildLink(
  publicAddress: string,
  language: Language,
  sharedBuildId: string,
): string {
  return `${publicAddress}${sharedBuildAddress(language, sharedBuildId)}`;
}

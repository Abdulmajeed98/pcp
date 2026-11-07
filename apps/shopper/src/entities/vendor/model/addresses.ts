import type { Language } from '@pcp/i18n';

// A Vendor page's address, in a language: `/<language>/vendors/<vendorId>`
// (the browse spec's The Shopper's addresses), with the page of its Offers
// after the first in its query, `?page=2`, counted from 1.
export function vendorAddress(language: Language, vendorId: string, page = 1): string {
  return `/${language}${vendorPath(vendorId)}${page > 1 ? `?page=${page}` : ''}`;
}

// The part of a Vendor page's address after its language, as a page's
// preview names it in every language.
export function vendorPath(vendorId: string): string {
  return `/vendors/${vendorId}`;
}

import type { Language } from '@pcp/i18n';

// A Vendor page's address, in a language: `/<language>/vendors/<vendorId>`
// (the browse spec's The Shopper's addresses).
export function vendorAddress(language: Language, vendorId: string): string {
  return `/${language}/vendors/${vendorId}`;
}

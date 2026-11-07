import { describe, expect, it } from 'vitest';

import { vendorAddress } from '@/entities/vendor';

const vendorId = '00000000-0000-4000-8000-000000000002';

// A Vendor page's address (the browse spec's The Shopper's addresses), in a
// language, with the page of its Offers in its query, so that the page can
// be reloaded, linked and shared.
describe("a Vendor page's address", () => {
  it('is the Vendor page alone for the first page of its Offers', () => {
    expect(vendorAddress('ckb', vendorId)).toBe(`/ckb/vendors/${vendorId}`);
    expect(vendorAddress('en', vendorId, 1)).toBe(`/en/vendors/${vendorId}`);
  });

  it('holds a page of its Offers after the first', () => {
    expect(vendorAddress('ar', vendorId, 3)).toBe(`/ar/vendors/${vendorId}?page=3`);
  });
});

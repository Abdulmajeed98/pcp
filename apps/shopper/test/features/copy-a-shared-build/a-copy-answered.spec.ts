import { describe, expect, it } from 'vitest';

import { addressAfterACopy, refusedCopyIn } from '@/features/copy-a-shared-build';

const sharedBuildId = '3f6c1e9a-8b2d-4f71-9c5e-a04d7b2e91c3';

// Copy into my Build is a plain form, sent with POST to
// `/<language>/builds/<id>/copy` and answered 303 (the sharing spec's The
// Shopper app): with the Build page from its top, holding the copy, or,
// when the API does not answer, back to the Shared Build page with its
// reason in the address, so that the page says it under the copy, with
// script and without.
describe('the address a copy is answered with', () => {
  it("is the Build page from its top, in the form's language", () => {
    expect(addressAfterACopy('en', sharedBuildId)).toBe('/en/build');
    expect(addressAfterACopy('ckb', sharedBuildId)).toBe('/ckb/build');
    expect(addressAfterACopy('ar', sharedBuildId)).toBe('/ar/build');
  });

  it('is the Shared Build page saying why, when the copy is refused', () => {
    const address = addressAfterACopy('ckb', sharedBuildId, 'notCopied');

    expect(address).toBe(`/ckb/builds/${sharedBuildId}?refused=notCopied`);
    expect(refusedCopyIn(new URL(address, 'http://shop.example').searchParams)).toBe(
      'notCopied',
    );
  });
});

// The Shared Build page reads nothing it does not know, so that an address
// changed by hand says nothing.
describe('why a copy was refused, as the Shared Build page reads it', () => {
  it.each(['', 'refused=', 'refused=notcopied', 'refused=notShared', 'copied=notCopied'])(
    'reads %j as no copy refused',
    (query) => {
      expect(refusedCopyIn(new URLSearchParams(query))).toBeUndefined();
    },
  );
});

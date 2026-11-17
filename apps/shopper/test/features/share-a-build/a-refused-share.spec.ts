import { describe, expect, it } from 'vitest';

import {
  refusedShareIn,
  type ShareRefusal,
  addressAfterARefusedShare,
} from '@/features/share-a-build';

const kit = '00000000-0000-4000-8000-0000000c0005';

// Share this Build is a plain form, answered 303 with the Shared Build page;
// a share refused comes back to the Build page with its reason in the
// address, so that the page says it under the button, with script or
// without (the sharing spec's The Shopper app): an API that does not
// answer, a Build the API refuses, and a Build with no Part to share.
describe('the address a refused share answers with', () => {
  it.each<[ShareRefusal, string]>([
    ['notShared', '/en/build?refused=notShared'],
    ['notReadable', '/en/build?refused=notReadable'],
    ['nothingToShare', '/en/build?refused=nothingToShare'],
  ])('is the Build page saying why: %s', (refused, address) => {
    expect(addressAfterARefusedShare('en', refused)).toBe(address);
    expect(refusedShareIn(new URL(address, 'http://shop.example').searchParams)).toBe(
      refused,
    );
  });

  it("is the Build page in the form's language", () => {
    expect(addressAfterARefusedShare('ckb', 'notShared')).toBe(
      '/ckb/build?refused=notShared',
    );
    expect(addressAfterARefusedShare('ar', 'nothingToShare')).toBe(
      '/ar/build?refused=nothingToShare',
    );
  });
});

// The Build page reads nothing it does not know, so that an address changed
// by hand, or one a change to the Build was refused with, says nothing of a
// share.
describe('why a share was refused, as the Build page reads it', () => {
  it.each([
    '',
    'refused=',
    'refused=notshared',
    'refused=empty',
    'refused=mostKitsOrDrives&category=ram',
    `refused=mostOfOne&category=ram&part=${kit}`,
    'shared=notShared',
  ])('reads %j as no share refused', (query) => {
    expect(refusedShareIn(new URLSearchParams(query))).toBeUndefined();
  });

  it('reads the first reason when the address repeats it', () => {
    expect(
      refusedShareIn(new URLSearchParams('refused=notReadable&refused=notShared')),
    ).toBe('notReadable');
  });
});

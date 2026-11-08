import { describe, expect, it } from 'vitest';

import type { Refusal } from '@/entities/build';
import { addressAfterAChange, refusalIn } from '@/features/change-the-build';

const kit = '00000000-0000-4000-8000-0000000c0005';

// Each form that changes the Build is answered 303 with the Build page, in
// the form's language, at the Category it changed, so that a phone lands on
// the line rather than at the top of a long page (DESIGN.md's Back to the
// Build after a pick). A change past the limits is not applied, and the
// page's address says why, so that the page says it, with script or
// without.
describe('the address a change to the Build answers with', () => {
  it('is the Build page at the Category changed, in the language of the form', () => {
    expect(addressAfterAChange('en', { at: 'ram' })).toBe('/en/build#ram');
    expect(addressAfterAChange('ckb', { at: 'cpuCooler' })).toBe('/ckb/build#cpu-cooler');
    expect(addressAfterAChange('ar', { at: 'psu' })).toBe('/ar/build#psu');
  });

  it('is the Build page from its top after emptying it', () => {
    expect(addressAfterAChange('en', {})).toBe('/en/build');
  });

  it.each<[Refusal, string]>([
    [
      { reason: 'mostKitsOrDrives', category: 'ram' },
      '/en/build?refused=mostKitsOrDrives&category=ram#ram',
    ],
    [
      { reason: 'mostKitsOrDrives', category: 'storage' },
      '/en/build?refused=mostKitsOrDrives&category=storage#storage',
    ],
    [
      { reason: 'mostOfOne', category: 'ram', part: kit },
      `/en/build?refused=mostOfOne&category=ram&part=${kit}#ram`,
    ],
    [
      { reason: 'notAQuantity', category: 'storage', part: kit },
      `/en/build?refused=notAQuantity&category=storage&part=${kit}#storage`,
    ],
  ])('says why a change was refused: %o', (refused, address) => {
    expect(addressAfterAChange('en', { at: refused.category, refused })).toBe(address);
    expect(refusalIn(new URL(address, 'http://shop.example').searchParams)).toEqual(
      refused,
    );
  });
});

// The Build page reads why from its address, and reads nothing it does not
// know, so that an address changed by hand says nothing.
describe('why a change was refused, as the Build page reads it', () => {
  it.each([
    '',
    'refused=mostKitsOrDrives',
    'refused=mostKitsOrDrives&category=cpu',
    'refused=mostKitsOrDrives&category=fan',
    'refused=tooMany&category=ram',
    `refused=mostOfOne&category=ram`,
    `refused=mostOfOne&category=ram&part=not-a-part`,
    `refused=notAQuantity&category=cpu&part=${kit}`,
  ])('reads %j as nothing refused', (query) => {
    expect(refusalIn(new URLSearchParams(query))).toBeUndefined();
  });

  it('reads a Part named in capitals as the same Part', () => {
    expect(
      refusalIn(
        new URLSearchParams(`refused=mostOfOne&category=ram&part=${kit.toUpperCase()}`),
      ),
    ).toEqual({ reason: 'mostOfOne', category: 'ram', part: kit });
  });
});

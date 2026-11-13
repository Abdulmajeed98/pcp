import { describe, expect, it } from 'vitest';

import { heldByTheCatalog, pickInto, readTheBuild } from '@/entities/build';

// Made-up Parts' identifiers, as the API names a Part.
const cpu = '00000000-0000-4000-8000-0000000c0001';
const board = '00000000-0000-4000-8000-0000000c0004';
const kit = '00000000-0000-4000-8000-0000000c0005';
const drive = '00000000-0000-4000-8000-0000000c0007';

// A made-up Part's identifier, numbered.
function madeUpPart(number: number): string {
  return `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
}

// A Part the catalog no longer holds is left out of the API's answer, so
// its Category shows as not chosen, and the cookie forgets it at the next
// change (the builder spec's The Build in the Shopper's browser): a change
// first keeps the Parts the API answered of the Build, then applies itself.
describe('the Build as the catalog holds it', () => {
  it('keeps the Parts the API answered, in their order, each with its quantity', () => {
    const build = readTheBuild(
      `cpu:${cpu},motherboard:${board},ram:${kit}:2,storage:${drive}:1`,
    );

    expect(heldByTheCatalog(build, [drive, kit, cpu, board])).toEqual(build);
  });

  it('forgets each Part the API did not answer, as one the catalog no longer holds', () => {
    const build = readTheBuild(
      `cpu:${cpu},motherboard:${board},ram:${kit}:2,storage:${drive}:1`,
    );

    expect(heldByTheCatalog(build, [cpu, drive])).toEqual([
      { category: 'cpu', part: cpu },
      { category: 'storage', part: drive, quantity: 1 },
    ]);
    expect(heldByTheCatalog(build, [])).toEqual([]);
  });

  it('lets a kit join a Build whose 8 kits the catalog no longer holds, once they are forgotten', () => {
    const eightGone = readTheBuild(
      Array.from({ length: 8 }, (_, place) => `ram:${madeUpPart(100 + place)}:1`).join(','),
    );

    expect(pickInto(eightGone, 'ram', kit)).toEqual({
      refused: { reason: 'mostKitsOrDrives', category: 'ram' },
    });
    expect(pickInto(heldByTheCatalog(eightGone, []), 'ram', kit)).toEqual({
      build: [{ category: 'ram', part: kit, quantity: 1 }],
    });
  });
});

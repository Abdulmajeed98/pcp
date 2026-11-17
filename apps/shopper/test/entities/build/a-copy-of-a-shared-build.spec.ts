import { describe, expect, it } from 'vitest';

import { copyOfTheSharedBuild, writeTheBuild } from '@/entities/build';

// Made-up Parts' identifiers, as the API names a Part.
const cpu = '00000000-0000-4000-8000-0000000c0001';
const board = '00000000-0000-4000-8000-0000000c0004';
const kit = '00000000-0000-4000-8000-0000000c0005';
const otherKit = '00000000-0000-4000-8000-0000000c0006';
const drive = '00000000-0000-4000-8000-0000000c0007';
const gpu = '00000000-0000-4000-8000-0000000c0008';

// A Shared Build's frozen `part` values, as the API stores them.
const shared = [cpu, board, `${kit}:2`, `${otherKit}:1`, `${drive}:3`, gpu];

// The Parts `GET v1/build` answers of those values, each by its identifier
// and its Category, in its order, as the API answers them.
const answered = [
  { id: cpu, category: 'cpu' },
  { id: board, category: 'motherboard' },
  { id: kit, category: 'ram' },
  { id: otherKit, category: 'ram' },
  { id: drive, category: 'storage' },
  { id: gpu, category: 'gpu' },
] as const;

// Copy into my Build (SHR-3, the sharing spec's The Shopper app): the
// Build the copy writes into the browser's cookie, from the Shared Build's
// values and the Parts the API still answers of them, each under the
// Category the API answers it in, so that the copy can be changed as any
// Build is.
describe('a copy of a Shared Build', () => {
  it('holds its Parts in its order, each kit and drive with its quantity', () => {
    expect(writeTheBuild(copyOfTheSharedBuild(shared, answered))).toBe(
      `cpu:${cpu},motherboard:${board},ram:${kit}:2,ram:${otherKit}:1,storage:${drive}:3,gpu:${gpu}`,
    );
  });

  it('leaves out each Part the catalog no longer answers', () => {
    const stillAnswered = answered.filter(({ id }) => id !== otherKit && id !== gpu);

    expect(writeTheBuild(copyOfTheSharedBuild(shared, stillAnswered))).toBe(
      `cpu:${cpu},motherboard:${board},ram:${kit}:2,storage:${drive}:3`,
    );
    expect(copyOfTheSharedBuild(shared, [])).toEqual([]);
  });

  it('reads identifiers in capitals as the API does', () => {
    expect(
      writeTheBuild(
        copyOfTheSharedBuild(
          shared.map((value) => value.toUpperCase()),
          answered,
        ),
      ),
    ).toBe(
      `cpu:${cpu},motherboard:${board},ram:${kit}:2,ram:${otherKit}:1,storage:${drive}:3,gpu:${gpu}`,
    );
  });
});

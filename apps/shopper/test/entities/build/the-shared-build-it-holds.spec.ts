import { describe, expect, it } from 'vitest';

import { holdsTheSharedBuild, readTheBuild } from '@/entities/build';

// Made-up Parts' identifiers, as the API names a Part.
const cpu = '00000000-0000-4000-8000-0000000c0001';
const board = '00000000-0000-4000-8000-0000000c0004';
const kit = '00000000-0000-4000-8000-0000000c0005';
const otherKit = '00000000-0000-4000-8000-0000000c0006';
const drive = '00000000-0000-4000-8000-0000000c0007';
const gpu = '00000000-0000-4000-8000-0000000c0008';

// A Shared Build's frozen `part` values, as the API stores them: lower-case
// identifiers, in the catalog's order of Categories, then the Build's order
// for kits and drives, each kit or drive with its quantity.
const shared = [cpu, board, `${kit}:2`, `${otherKit}:1`, `${drive}:1`, gpu];

// "This is your Build" (the sharing spec's The Shopper app): the Shared
// Build page compares the browser's Build, read from its cookie, with the
// Shared Build's values, so that the browser that shared it, or copied it,
// is told so and offered no copy.
describe('whether the browser holds the Shared Build', () => {
  it('holds it with the same Parts and quantities, whatever order the Categories were picked in', () => {
    const pickedInItsOrder = readTheBuild(
      `cpu:${cpu},motherboard:${board},ram:${kit}:2,ram:${otherKit}:1,storage:${drive}:1,gpu:${gpu}`,
    );
    const pickedGpuFirst = readTheBuild(
      `gpu:${gpu},ram:${kit}:2,storage:${drive}:1,cpu:${cpu},ram:${otherKit}:1,motherboard:${board}`,
    );

    expect(holdsTheSharedBuild(pickedInItsOrder, shared)).toBe(true);
    expect(holdsTheSharedBuild(pickedGpuFirst, shared)).toBe(true);
  });

  it('holds it whatever the case of the identifiers the Shared Build answers', () => {
    const build = readTheBuild(
      `cpu:${cpu},motherboard:${board},ram:${kit}:2,ram:${otherKit}:1,storage:${drive}:1,gpu:${gpu}`,
    );

    expect(
      holdsTheSharedBuild(
        build,
        shared.map((value) => value.toUpperCase()),
      ),
    ).toBe(true);
  });

  it('does not hold it with another quantity of a kit', () => {
    const build = readTheBuild(
      `cpu:${cpu},motherboard:${board},ram:${kit}:3,ram:${otherKit}:1,storage:${drive}:1,gpu:${gpu}`,
    );

    expect(holdsTheSharedBuild(build, shared)).toBe(false);
  });

  it('does not hold it with its kits in another order, which the API shares as another Build', () => {
    const build = readTheBuild(
      `cpu:${cpu},motherboard:${board},ram:${otherKit}:1,ram:${kit}:2,storage:${drive}:1,gpu:${gpu}`,
    );

    expect(holdsTheSharedBuild(build, shared)).toBe(false);
  });

  it('does not hold it with a Part more or a Part fewer', () => {
    const fewer = readTheBuild(
      `cpu:${cpu},motherboard:${board},ram:${kit}:2,ram:${otherKit}:1,storage:${drive}:1`,
    );

    expect(holdsTheSharedBuild(fewer, shared)).toBe(false);
    expect(holdsTheSharedBuild(fewer, shared.slice(0, 4))).toBe(false);
  });

  it('does not hold it with an empty Build', () => {
    expect(holdsTheSharedBuild(readTheBuild(undefined), shared)).toBe(false);
  });
});

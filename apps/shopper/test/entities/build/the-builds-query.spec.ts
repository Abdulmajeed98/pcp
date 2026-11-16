import { describe, expect, it } from 'vitest';

import { partsCountedIn, partValuesOf, readTheBuild } from '@/entities/build';

const cpu = '00000000-0000-4000-8000-0000000c0001';
const board = '00000000-0000-4000-8000-0000000c0004';
const kit = '00000000-0000-4000-8000-0000000c0005';
const otherKit = '00000000-0000-4000-8000-0000000c0006';
const drive = '00000000-0000-4000-8000-0000000c0007';

const aBuild = readTheBuild(
  `cpu:${cpu},ram:${kit}:2,motherboard:${board},ram:${otherKit}:1,storage:${drive}:16`,
);

// The Shopper app's server sends the Build to the API as `GET v1/build`'s
// query, and the picker's: each Part's identifier, followed for a RAM kit or
// a drive by `:` and its quantity, repeated in `part`. The browser never
// calls the API.
describe('the Build as the API reads it', () => {
  it("gives each Part's identifier in the Build's order, a kit or a drive with its quantity", () => {
    expect(partValuesOf(aBuild)).toEqual([
      cpu,
      `${kit}:2`,
      board,
      `${otherKit}:1`,
      `${drive}:16`,
    ]);
  });

  it('gives nothing for an empty Build, which the API reads as empty', () => {
    expect(partValuesOf([])).toEqual([]);
  });
});

// The frame's way to the Build page says how many Parts the Build holds,
// read from the cookie, so that the Shopper knows whether they have started
// one (DESIGN.md's The way to the Build): each Part once, whatever its
// quantity, as the Build's sheet lists each once.
describe("the frame's count of the Build's Parts", () => {
  it('counts each Part once, a kit or a drive whatever its quantity', () => {
    expect(partsCountedIn(aBuild)).toBe(5);
  });

  it('counts none in an empty Build', () => {
    expect(partsCountedIn([])).toBe(0);
  });

  it('counts only what could be read of the cookie', () => {
    expect(partsCountedIn(readTheBuild(`cpu:${cpu},cpu:${board},ram:${kit}:99`))).toBe(1);
  });
});

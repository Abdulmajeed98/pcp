import { describe, expect, it } from 'vitest';

import {
  type Build,
  changeTheQuantity,
  pickInto,
  readTheBuild,
  removeFrom,
  writeTheBuild,
} from '@/entities/build';

// Made-up Parts' identifiers, as the API names a Part.
const cpu = '00000000-0000-4000-8000-0000000c0001';
const otherCpu = '00000000-0000-4000-8000-0000000c0002';
const board = '00000000-0000-4000-8000-0000000c0004';
const kit = '00000000-0000-4000-8000-0000000c0005';
const otherKit = '00000000-0000-4000-8000-0000000c0006';
const drive = '00000000-0000-4000-8000-0000000c0007';

const aBuild = readTheBuild(
  `cpu:${cpu},motherboard:${board},ram:${kit}:2,storage:${drive}:1`,
);

// A made-up Part's identifier, numbered.
function madeUpPart(number: number): string {
  return `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
}

// A Build of a CPU and 8 different kits, the first held 16 times.
const eightKits: Build = [
  { category: 'cpu', part: cpu },
  ...Array.from({ length: 8 }, (_, place) => ({
    category: 'ram' as const,
    part: madeUpPart(100 + place),
    quantity: place === 0 ? 16 : 1,
  })),
];

// What the cookie holds after a change that is applied.
function writtenAfter(changed: ReturnType<typeof pickInto>): string {
  if (!('build' in changed)) throw new Error('The change was refused.');
  return writeTheBuild(changed.build);
}

// The pick form sends a Category and a Part (BLD-1).
describe('picking a Part', () => {
  it('puts the first Part into an empty Build', () => {
    expect(writtenAfter(pickInto([], 'cpu', cpu))).toBe(`cpu:${cpu}`);
    expect(writtenAfter(pickInto([], 'ram', kit))).toBe(`ram:${kit}:1`);
  });

  it("replaces the Build's Part of a Category that holds one, in its place", () => {
    expect(writtenAfter(pickInto(aBuild, 'cpu', otherCpu))).toBe(
      `cpu:${otherCpu},motherboard:${board},ram:${kit}:2,storage:${drive}:1`,
    );
  });

  it('adds a kit or a drive the Build does not hold, with a quantity of one, after the others', () => {
    expect(writtenAfter(pickInto(aBuild, 'ram', otherKit))).toBe(
      `cpu:${cpu},motherboard:${board},ram:${kit}:2,storage:${drive}:1,ram:${otherKit}:1`,
    );
  });

  it('counts a kit or a drive the Build holds once more', () => {
    expect(writtenAfter(pickInto(aBuild, 'ram', kit))).toBe(
      `cpu:${cpu},motherboard:${board},ram:${kit}:3,storage:${drive}:1`,
    );
    expect(writtenAfter(pickInto(aBuild, 'storage', drive))).toBe(
      `cpu:${cpu},motherboard:${board},ram:${kit}:2,storage:${drive}:2`,
    );
  });

  it('reads an identifier in capitals as the same Part', () => {
    expect(writtenAfter(pickInto(aBuild, 'ram', kit.toUpperCase()))).toBe(
      `cpu:${cpu},motherboard:${board},ram:${kit}:3,storage:${drive}:1`,
    );
  });

  // The pick form is the platform's own, so these come only from a form
  // changed by hand; the Build is kept as it was.
  it.each([
    ['a Category that is not one of the eight', 'fan', otherCpu],
    ['a Part that is not an identifier', 'cpu', 'not-a-part'],
    ['a Part the Build holds under another Category', 'storage', kit],
    ['the Part the Build holds already', 'cpu', cpu],
  ])('leaves the Build as it is for %s', (_, category, part) => {
    expect(pickInto(aBuild, category, part)).toEqual({ build: aBuild });
  });

  // The limits: at most 8 different RAM kits and 8 different drives, each
  // held 16 times at most. A pick past them is not applied, and says why.
  it('refuses a ninth different kit, saying that 8 is the most', () => {
    expect(pickInto(eightKits, 'ram', madeUpPart(999))).toEqual({
      refused: { reason: 'mostKitsOrDrives', category: 'ram' },
    });
  });

  it('refuses one more of a kit the Build holds 16 of, saying that 16 is the most', () => {
    expect(pickInto(eightKits, 'ram', madeUpPart(100))).toEqual({
      refused: { reason: 'mostOfOne', category: 'ram', part: madeUpPart(100) },
    });
  });

  it('still counts one more of a kit among 8 that the Build holds fewer than 16 of', () => {
    expect(writtenAfter(pickInto(eightKits, 'ram', madeUpPart(101)))).toContain(
      `ram:${madeUpPart(101)}:2`,
    );
  });

  it('still adds a drive beside 8 kits', () => {
    expect(writtenAfter(pickInto(eightKits, 'storage', drive))).toMatch(
      new RegExp(`,storage:${drive}:1$`),
    );
  });
});

// The quantity form sends a kit's or a drive's Part and the quantity, typed
// on the phone's number pad or sent by − and +.
describe("changing a kit's or a drive's quantity", () => {
  it('holds it the number of times sent, from 1 to 16', () => {
    expect(writtenAfter(changeTheQuantity(aBuild, kit, '5'))).toBe(
      `cpu:${cpu},motherboard:${board},ram:${kit}:5,storage:${drive}:1`,
    );
    expect(writtenAfter(changeTheQuantity(aBuild, kit, '1'))).toBe(
      `cpu:${cpu},motherboard:${board},ram:${kit}:1,storage:${drive}:1`,
    );
    expect(writtenAfter(changeTheQuantity(aBuild, drive, '16'))).toBe(
      `cpu:${cpu},motherboard:${board},ram:${kit}:2,storage:${drive}:16`,
    );
  });

  it('reads Arabic-Indic and Eastern Arabic-Indic digits, and spaces around them', () => {
    expect(writtenAfter(changeTheQuantity(aBuild, kit, '١٢'))).toContain(`ram:${kit}:12`);
    expect(writtenAfter(changeTheQuantity(aBuild, kit, '۳'))).toContain(`ram:${kit}:3`);
    expect(writtenAfter(changeTheQuantity(aBuild, kit, ' 4 '))).toContain(`ram:${kit}:4`);
  });

  it.each(['0', '17', '100', '-1', '2.5', 'two', ''])(
    'refuses %j, saying that a quantity is from 1 to 16',
    (typed) => {
      expect(changeTheQuantity(aBuild, kit, typed)).toEqual({
        refused: { reason: 'notAQuantity', category: 'ram', part: kit },
      });
    },
  );

  it('leaves the Build as it is for a Part it does not hold as a kit or a drive', () => {
    expect(changeTheQuantity(aBuild, otherKit, '3')).toEqual({ build: aBuild });
    expect(changeTheQuantity(aBuild, cpu, '3')).toEqual({ build: aBuild });
  });
});

describe('removing a Part', () => {
  it('takes it out and keeps the rest in their order', () => {
    expect(writeTheBuild(removeFrom(aBuild, board))).toBe(
      `cpu:${cpu},ram:${kit}:2,storage:${drive}:1`,
    );
    expect(writeTheBuild(removeFrom(aBuild, kit))).toBe(
      `cpu:${cpu},motherboard:${board},storage:${drive}:1`,
    );
  });

  it('takes out a Part named in capitals', () => {
    expect(writeTheBuild(removeFrom(aBuild, cpu.toUpperCase()))).toBe(
      `motherboard:${board},ram:${kit}:2,storage:${drive}:1`,
    );
  });

  it('leaves the Build as it is for a Part it does not hold', () => {
    expect(removeFrom(aBuild, otherCpu)).toEqual(aBuild);
  });
});

// Emptying the Build writes an empty one, which reads as no Part.
describe('emptying the Build', () => {
  it('writes a Build that reads as empty', () => {
    expect(writeTheBuild([])).toBe('');
    expect(readTheBuild(writeTheBuild([]))).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';

import { type Build, readTheBuild } from '@/entities/build';

// Made-up Parts' identifiers, as the API names a Part.
const cpu = '00000000-0000-4000-8000-0000000c0001';
const otherCpu = '00000000-0000-4000-8000-0000000c0002';
const cooler = '00000000-0000-4000-8000-0000000c0003';
const board = '00000000-0000-4000-8000-0000000c0004';
const kit = '00000000-0000-4000-8000-0000000c0005';
const otherKit = '00000000-0000-4000-8000-0000000c0006';
const drive = '00000000-0000-4000-8000-0000000c0007';
const psu = '00000000-0000-4000-8000-0000000c0008';

// A Build of a CPU, a CPU cooler, a motherboard, two kits and a drive, as
// the cookie holds it.
const aBuild: Build = [
  { category: 'cpu', part: cpu },
  { category: 'cpuCooler', part: cooler },
  { category: 'motherboard', part: board },
  { category: 'ram', part: kit, quantity: 2 },
  { category: 'ram', part: otherKit, quantity: 1 },
  { category: 'storage', part: drive, quantity: 16 },
];
const aBuildsText = `cpu:${cpu},cpuCooler:${cooler},motherboard:${board},ram:${kit}:2,ram:${otherKit}:1,storage:${drive}:16`;

// The `build` cookie holds each Part's identifier under its Category, and for
// a RAM kit or a drive its quantity: one entry for each Part, in the Build's
// order, joined by commas.
describe('reading the Build from its cookie', () => {
  it('reads each Part under its Category, a kit or a drive with its quantity', () => {
    expect(readTheBuild(aBuildsText)).toEqual(aBuild);
  });

  it('reads no cookie, and an empty one, as an empty Build', () => {
    expect(readTheBuild(undefined)).toEqual([]);
    expect(readTheBuild('')).toEqual([]);
  });

  // An identifier is written in either case, and the API writes it in small
  // letters.
  it('reads an identifier in capitals as the same identifier', () => {
    expect(readTheBuild(`cpu:${cpu.toUpperCase()}`)).toEqual([
      { category: 'cpu', part: cpu },
    ]);
  });

  // A cookie the platform did not write, or one from an older version, is
  // never refused: each entry that cannot be read is dropped, and the Build
  // is what could be read.
  describe('drops each entry that cannot be read, and keeps the rest', () => {
    it.each([
      ['an identifier that is not one', `cpu:not-an-identifier`],
      ['an identifier cut short', `cpu:${cpu.slice(0, -1)}`],
      ['no identifier', `cpu:`],
      ['a Category alone', `cpu`],
      ['a Category that is not one of the eight', `fan:${cpu}`],
      ['a Category in the address', `cpu-cooler:${cooler}`],
      ['a Category in another case', `CPU:${cpu}`],
      ['a quantity of 0', `ram:${kit}:0`],
      ['a quantity of 17', `ram:${kit}:17`],
      ['a quantity that is not a whole number', `ram:${kit}:1.5`],
      ['a quantity with a sign', `ram:${kit}:+2`],
      ['a quantity in Arabic-Indic digits', `ram:${kit}:٢`],
      ['a kit with no quantity', `ram:${kit}`],
      ['a quantity on a Part of a Category that holds one', `cpu:${cpu}:1`],
      ['more than a quantity', `ram:${kit}:2:3`],
    ])('%s', (_, entry) => {
      expect(readTheBuild(`${entry},psu:${psu}`)).toEqual([{ category: 'psu', part: psu }]);
    });
  });

  it('keeps the first Part of a Category that holds one, and drops a second', () => {
    expect(readTheBuild(`cpu:${cpu},motherboard:${board},cpu:${otherCpu}`)).toEqual([
      { category: 'cpu', part: cpu },
      { category: 'motherboard', part: board },
    ]);
  });

  it('keeps the first of a Part repeated, under any Category, and drops the rest', () => {
    expect(
      readTheBuild(`ram:${kit}:2,ram:${kit}:5,storage:${kit}:1,ram:${otherKit}:1`),
    ).toEqual([
      { category: 'ram', part: kit, quantity: 2 },
      { category: 'ram', part: otherKit, quantity: 1 },
    ]);
    expect(readTheBuild(`cpu:${cpu},cpuCooler:${cpu.toUpperCase()}`)).toEqual([
      { category: 'cpu', part: cpu },
    ]);
  });

  // The limits: at most 8 different RAM kits and 8 different drives.
  it('keeps the first 8 different kits and drives, and drops the rest', () => {
    const kits = Array.from({ length: 10 }, (_, place) => madeUpPart(100 + place));
    const drives = Array.from({ length: 9 }, (_, place) => madeUpPart(200 + place));
    const text = [
      ...kits.map((part) => `ram:${part}:1`),
      ...drives.map((part) => `storage:${part}:3`),
    ].join(',');

    expect(readTheBuild(text)).toEqual([
      ...kits.slice(0, 8).map((part) => ({ category: 'ram', part, quantity: 1 })),
      ...drives.slice(0, 8).map((part) => ({ category: 'storage', part, quantity: 3 })),
    ]);
  });

  it('reads whatever else the cookie holds as nothing', () => {
    expect(readTheBuild(',,')).toEqual([]);
    expect(readTheBuild('{"cpu":"x"}')).toEqual([]);
    expect(readTheBuild(` cpu:${cpu}`)).toEqual([]);
  });
});

// A made-up Part's identifier, numbered.
function madeUpPart(number: number): string {
  return `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
}

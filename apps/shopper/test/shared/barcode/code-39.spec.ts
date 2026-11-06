import { describe, expect, it } from 'vitest';

import { code39 } from '@/shared/barcode';

// The 43 characters Code 39 writes (ISO/IEC 16388): the digits, the capital
// letters, the space and six signs.
const writable = [...'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ -.$/+%'];

// A part number as a Code 39 barcode, in modules, the width of a narrow bar:
// a wide bar or space is three, characters are a narrow space apart, and a
// quiet zone of ten lies at each end. Each character is nine elements, five
// bars and four spaces, three of them wide, between the start and stop
// character, `*`.
describe('a Code 39 barcode', () => {
  // "*A*" from the standard's table, where 1 is a wide element and 0 a
  // narrow one, bar and space in turn from a bar: `*` is 010010100 and `A`
  // is 100001001.
  it('writes "A" between its start and stop characters, with its quiet zones', () => {
    expect(code39('A')).toEqual({
      modules: 67,
      bars: [
        // *
        { x: 10, width: 1 },
        { x: 14, width: 1 },
        { x: 16, width: 3 },
        { x: 20, width: 3 },
        { x: 24, width: 1 },
        // A
        { x: 26, width: 3 },
        { x: 30, width: 1 },
        { x: 32, width: 1 },
        { x: 36, width: 1 },
        { x: 38, width: 3 },
        // *
        { x: 42, width: 1 },
        { x: 46, width: 1 },
        { x: 48, width: 3 },
        { x: 52, width: 3 },
        { x: 56, width: 1 },
      ],
    });
  });

  // `$`, `/`, `+` and `%` are the four characters whose three wide elements
  // are all spaces: `$` is 010101000.
  it('writes "$" with its five bars narrow', () => {
    expect(code39('$')?.bars.slice(5, 10)).toEqual([
      { x: 26, width: 1 },
      { x: 30, width: 1 },
      { x: 34, width: 1 },
      { x: 38, width: 1 },
      { x: 40, width: 1 },
    ]);
  });

  it.each(writable)(
    'writes "%s" in fifteen modules, three of its nine elements wide',
    (character) => {
      const written = code39(character);
      expect(written?.modules).toBe(10 + 15 + 1 + 15 + 1 + 15 + 10);
      expect(written?.bars).toHaveLength(15);
    },
  );

  it('gives every character a pattern of its own', () => {
    const patterns = writable.map((character) =>
      JSON.stringify(code39(character)?.bars.slice(5, 10)),
    );
    expect(new Set(patterns).size).toBe(writable.length);
  });

  it('writes a part number of many characters, sixteen modules a character', () => {
    const written = code39('100-100000910WOF');
    expect(written?.modules).toBe(20 + 18 * 16 - 1);
    expect(written?.bars).toHaveLength(18 * 5);
  });

  // A barcode that left a character out, or wrote it otherwise, would read
  // as another part number.
  it.each([
    '',
    'Ryzen 7',
    'HS01(B)',
    'EMD625AWT_II',
    '48U45AA#ABC',
    'A*B',
    'Threadripper™',
  ])(
    'writes no barcode of "%s", which holds a character Code 39 does not write',
    (text) => {
      expect(code39(text)).toBeUndefined();
    },
  );
});

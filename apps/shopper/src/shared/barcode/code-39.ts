// Code 39, as ISO/IEC 16388 sets it out: each character is nine elements,
// five bars and four spaces in turn from a bar, three of them wide. The
// table builds each character as the standard does, from the pattern of its
// bars, one of ten, and the place of its one wide space, one of four: the
// digits take the second space, A to J the third, K to T the fourth, and U
// to Z, the minus, the point, the space and the start and stop character,
// `*`, the first. `$`, `/`, `+` and `%` have five narrow bars and three wide
// spaces of four.
const barsByColumn = [
  '10001',
  '01001',
  '11000',
  '00101',
  '10100',
  '01100',
  '00011',
  '10010',
  '01010',
  '00110',
] as const;

const rows = [
  { characters: '1234567890', wideSpaces: '0100' },
  { characters: 'ABCDEFGHIJ', wideSpaces: '0010' },
  { characters: 'KLMNOPQRST', wideSpaces: '0001' },
  { characters: 'UVWXYZ-. *', wideSpaces: '1000' },
] as const;

// Each character's nine elements, 1 for a wide one: bar, space, bar, …, bar.
const patterns = new Map<string, string>([
  ...rows.flatMap(({ characters, wideSpaces }) =>
    [...characters].map((character, column): [string, string] => {
      const bars = barsByColumn[column];
      const pattern = [...bars]
        .flatMap((bar, place) => (place < 4 ? [bar, wideSpaces[place]] : [bar]))
        .join('');
      return [character, pattern];
    }),
  ),
  ['$', '010101000'],
  ['/', '010100010'],
  ['+', '010001010'],
  ['%', '000101010'],
]);

// The widths, in modules, the width of a narrow bar: a wide element is
// three, within the standard's two to three; characters are a narrow space
// apart; and a quiet zone of ten lies at each end, as the standard asks, so
// that a reader finds where the barcode starts and stops.
const narrow = 1;
const wide = 3;
const quietZone = 10;

// A barcode in modules: how wide it is, quiet zones and all, and where each
// bar starts and how wide it is.
export interface Code39 {
  modules: number;
  bars: { x: number; width: number }[];
}

// A text as a Code 39 barcode, between its start and stop characters, or
// none when it holds a character Code 39 does not write, such as a small
// letter, a bracket or `*`, or nothing at all: a barcode that left a
// character out, or changed it, would read as another text.
export function code39(text: string): Code39 | undefined {
  if (
    text === '' ||
    [...text].some((character) => character === '*' || !patterns.has(character))
  ) {
    return undefined;
  }

  const bars: Code39['bars'] = [];
  let x = quietZone;
  for (const [place, character] of [...`*${text}*`].entries()) {
    if (place > 0) x += narrow;
    for (const [element, kind] of [...(patterns.get(character) ?? '')].entries()) {
      const width = kind === '1' ? wide : narrow;
      if (element % 2 === 0) bars.push({ x, width });
      x += width;
    }
  }
  return { modules: x + quietZone, bars };
}

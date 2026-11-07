import { Category } from '~/domain/part/Category';
import { filterParameters, filtersOf } from '~/domain/specification/filters';

// The filters are written once, as a table read when the API starts
// (`filters.ts`), and domain code never throws (ADR-0004): a filter whose
// path its Category's list lacks, or whose specification holds a list,
// which a filter cannot choose among, is left out of the table rather than
// stopping the API. These lines prove the table whole: every Category's
// filters are those BRW-2 names, each at its place in a Part's document and
// of the kind of value it offers, and a parameter two Categories share asks
// the same kind of value of both, as a request declares it once.
describe("the Categories' filters", () => {
  it.each([
    [
      'cpu',
      [
        ['socket', 'socket', 'text'],
        ['cores', 'cores.total', 'number'],
      ],
    ],
    [
      'cpuCooler',
      [
        ['waterCooled', 'water_cooled', 'yesNo'],
        ['radiatorSize', 'radiator_size', 'number'],
      ],
    ],
    [
      'motherboard',
      [
        ['socket', 'socket', 'text'],
        ['formFactor', 'form_factor', 'text'],
        ['ramType', 'memory.ram_type', 'text'],
      ],
    ],
    [
      'ram',
      [
        ['ramType', 'ram_type', 'text'],
        ['capacity', 'capacity', 'number'],
        ['speed', 'speed', 'number'],
      ],
    ],
    [
      'storage',
      [
        ['driveType', 'storage_type', 'text'],
        ['capacity', 'capacity', 'number'],
        ['interface', 'interface', 'text'],
      ],
    ],
    [
      'gpu',
      [
        ['chipset', 'chipset', 'text'],
        ['memory', 'memory', 'number'],
      ],
    ],
    ['case', [['formFactor', 'form_factor', 'text']]],
    [
      'psu',
      [
        ['wattage', 'wattage', 'number'],
        ['efficiencyRating', 'efficiency_rating', 'text'],
      ],
    ],
  ])(
    'are those BRW-2 names for the Category %s, each at its path and of its kind',
    (key, expected) => {
      const category = Category.withKey(key);

      expect(category).toBeDefined();
      expect(
        filtersOf(category as Category).map((filter) => [
          filter.getParameter(),
          filter.getSpecification().getPath(),
          filter.getKind(),
        ]),
      ).toEqual(expected);
    },
  );

  it('ask a parameter two Categories share of filters of one kind', () => {
    const kindsOf = [...filterParameters()].map(([parameter, filters]) => [
      parameter,
      [...new Set(filters.map((filter) => filter.getKind()))],
    ]);

    expect(kindsOf).toEqual([
      ['socket', ['text']],
      ['cores', ['number']],
      ['waterCooled', ['yesNo']],
      ['radiatorSize', ['number']],
      ['formFactor', ['text']],
      ['ramType', ['text']],
      ['capacity', ['number']],
      ['speed', ['number']],
      ['driveType', ['text']],
      ['interface', ['text']],
      ['chipset', ['text']],
      ['memory', ['number']],
      ['wattage', ['number']],
      ['efficiencyRating', ['text']],
    ]);
  });
});

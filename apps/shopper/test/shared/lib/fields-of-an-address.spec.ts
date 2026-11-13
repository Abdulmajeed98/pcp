import { describe, expect, it } from 'vitest';

import { fieldsOf } from '@/shared/lib';

// An address's query as Next hands it to a page, read back as its fields,
// as a form's fields and `URLSearchParams` take them: what a Category page,
// the picker and the Build page each read of their own address.
describe("the fields of an address's query", () => {
  it('gives each parameter with its value, in the order of the address', () => {
    expect(fieldsOf({ search: 'ryzen', page: '2' })).toEqual([
      ['search', 'ryzen'],
      ['page', '2'],
    ]);
  });

  it('gives each value of a repeated parameter on its own, in its order', () => {
    expect(fieldsOf({ socket: ['AM5', 'AM4'], show: 'all' })).toEqual([
      ['socket', 'AM5'],
      ['socket', 'AM4'],
      ['show', 'all'],
    ]);
  });

  it('leaves out a parameter with no value', () => {
    expect(fieldsOf({ search: undefined, refused: 'mostOfOne' })).toEqual([
      ['refused', 'mostOfOne'],
    ]);
    expect(fieldsOf({})).toEqual([]);
  });
});

import { describe, expect, it } from '@jest/globals';

import { BadCommandLine, shopperCommandLine } from '../shopper-command-line.ts';

const origin = 'http://localhost:3100';

function read(line: string) {
  return shopperCommandLine(line.split(' ').filter(Boolean), origin);
}

describe("the Shopper's inspection's command line", () => {
  it("puts the language before the page's path, on the inspection's own Shopper app", () => {
    expect(read('/categories/gpu --language en')).toEqual({
      address: 'http://localhost:3100/en/categories/gpu',
      scheme: undefined,
      inspectorArgs: ['http://localhost:3100/en/categories/gpu'],
    });
    expect(read('/ --language ar').address).toBe('http://localhost:3100/ar');
    expect(read('/categories/cpu?search=ryzen&page=1 --language en').address).toBe(
      'http://localhost:3100/en/categories/cpu?search=ryzen&page=1',
    );
  });

  it("opens the page in Kurdish, the Shopper app's own first language, when no language is given", () => {
    expect(read('/').address).toBe('http://localhost:3100/ckb');
    expect(read('/vendors/some-vendor').address).toBe(
      'http://localhost:3100/ckb/vendors/some-vendor',
    );
  });

  it("takes the scheme, and passes the inspector's own options through after the address", () => {
    expect(
      read('/ --scheme dark --widths 1440,768,390 --out .taste-skill/x --language en'),
    ).toEqual({
      address: 'http://localhost:3100/en',
      scheme: 'dark',
      inspectorArgs: [
        'http://localhost:3100/en',
        '--widths',
        '1440,768,390',
        '--out',
        '.taste-skill/x',
      ],
    });
  });

  it('takes the currency every tab shows prices in, and keeps it from the inspector', () => {
    expect(read('/categories/cpu --currency USD --language en')).toEqual({
      address: 'http://localhost:3100/en/categories/cpu',
      scheme: undefined,
      currency: 'USD',
      inspectorArgs: ['http://localhost:3100/en/categories/cpu'],
    });
    expect(read('/ --currency IQD').currency).toBe('IQD');
    expect(read('/').currency).toBeUndefined();
  });

  it('refuses a line it cannot read', () => {
    for (const line of [
      '',
      '--language en',
      'categories/gpu',
      'http://localhost:3000/en',
      '/en/categories/gpu',
      '/ckb',
      '/ --language fr',
      '/ --language',
      '/ --scheme blue',
      '/ --currency EUR',
      '/ --currency usd',
      '/ --currency',
    ]) {
      expect(() => read(line)).toThrow(BadCommandLine);
    }
  });
});

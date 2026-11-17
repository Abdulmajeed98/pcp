import type { BuildPartResponse } from '@pcp/api-client';
import { type Language, languages } from '@pcp/i18n';
import { describe, expect, it } from 'vitest';

import { sharedBuildPreview } from '@/_pages/shared-build';

const publicAddress = 'https://parts.example';
const sharedBuildId = '3f6c1e9a-8b2d-4f71-9c5e-a04d7b2e91c3';

type Category = BuildPartResponse['category'];

// A made-up Part of the Shared Build, as `GET v1/build` answers it, with a
// photo or none, and a Lowest Price, which no preview names.
function aPart(
  category: Category,
  number: number,
  name: string,
  photo = false,
): BuildPartResponse {
  const id = `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
  return {
    id,
    category,
    name,
    manufacturer: 'Made-up Devices',
    partNumbers: [],
    photoPath: photo ? `/v1/photos/00000000-0000-4000-8000-0000000099${number}` : null,
    quantity: category === 'ram' || category === 'storage' ? 2 : null,
    visible: true,
    unstocked: false,
    priceNotShown: false,
    lowestPrice: {
      shownPrice: { currency: 'IQD', amount: '172000', converted: false },
      timesQuantity: { currency: 'IQD', amount: '344000', converted: false },
      vendor: { id: '00000000-0000-4000-8000-000000000001', name: 'Made-up PC Parts' },
    },
  };
}

// A Shared Build's Parts as the API answers them, in the catalog's order of
// Categories: eight Parts, the motherboard the first with a photo.
const cpu = aPart('cpu', 11, 'Made-up Ryzen 5 7600X');
const board = aPart('motherboard', 12, 'Made-up B650 Board', true);
const kit = aPart('ram', 13, 'Made-up 32GB Kit');
const drive = aPart('storage', 14, 'Made-up 1TB Drive', true);
const gpu = aPart('gpu', 15, 'Made-up RTX 4070', true);
const theCase = aPart('case', 16, 'Made-up Case');
const psu = aPart('psu', 17, 'Made-up 750W PSU');
const cooler = aPart('cpuCooler', 18, 'Made-up Cooler');
const eight = [cpu, cooler, board, kit, drive, gpu, theCase, psu];

// A Shared Build as the API stores it, of the Parts given: its frozen `part`
// values, each kit's and drive's with its quantity.
function sharedOf(parts: readonly BuildPartResponse[]) {
  return {
    id: sharedBuildId,
    part: parts.map(({ id, quantity }) => (quantity === null ? id : `${id}:${quantity}`)),
  };
}

// What a chat app shows of a Shared Build's link (success criterion 12, the
// sharing spec's The Shopper app): in the link's language, its title names
// the Build by how many Parts it holds; its description names its CPU and
// GPU when it has them, and no price and no city; its image is the photo of
// its first Part with one, in the catalog's order of Categories; and the
// page is marked for search engines not to index.
const titles: Record<Language, string> = {
  en: 'A shared Build of 8 Parts · PC Parts and Prices',
  ckb: 'بیڵدێکی هاوبەشکراوی 8 پارچە · پارچە و نرخی کۆمپیوتەر',
  ar: 'تجميعة مُشارَكة من 8 قطع · قطع الحاسوب وأسعارها',
};

const descriptions: Record<Language, string> = {
  en: 'A PC with the Made-up Ryzen 5 7600X and the Made-up RTX 4070. See its Parts, whether they work together, and what each Vendor charges for them.',
  ckb: 'کۆمپیوتەرێک بە Made-up Ryzen 5 7600X و Made-up RTX 4070. پارچەکانی ببینە، ئایا پێکەوە دەگونجێن، و هەر فرۆشیارێک چەندیان پێ دەوێت.',
  ar: 'حاسوب مع Made-up Ryzen 5 7600X وMade-up RTX 4070. اطّلع على قطعه، وهل تعمل معًا، وما يطلبه كل بائع ثمنًا لها.',
};

describe("a Shared Build page's preview", () => {
  describe.each(languages)('in %s', (language) => {
    const preview = sharedBuildPreview({
      language,
      shared: sharedOf(eight),
      parts: eight,
      publicAddress,
    });

    it('is titled by how many Parts the Build holds, and the site', () => {
      expect(preview.title).toBe(titles[language]);
      expect(preview.openGraph?.title).toBe(titles[language]);
    });

    it('names its CPU and its GPU, and no price', () => {
      expect(preview.description).toBe(descriptions[language]);
      expect(preview.openGraph?.description).toBe(descriptions[language]);
      expect(preview.description).not.toMatch(/172,?000|344,?000|IQD|\$/);
    });

    it('shows the photo of its first Part with one, in the catalog’s order', () => {
      expect(preview.openGraph?.images).toEqual([
        'https://parts.example/photos/00000000-0000-4000-8000-000000009912',
      ]);
    });

    it('is marked for search engines not to index', () => {
      expect(preview.robots).toEqual({ index: false });
    });

    it('names the Shared Build page in its language as its own address', () => {
      expect(preview.alternates?.canonical).toBe(
        `https://parts.example/${language}/builds/${sharedBuildId}`,
      );
      expect(preview.openGraph).toMatchObject({
        url: `https://parts.example/${language}/builds/${sharedBuildId}`,
      });
    });
  });

  it('counts each Part once, whatever its quantity, as the slip counts them', () => {
    const one = sharedBuildPreview({
      language: 'en',
      shared: sharedOf([kit]),
      parts: [kit],
      publicAddress,
    });

    expect(one.title).toBe('A shared Build of 1 Part · PC Parts and Prices');
  });

  it('counts the Parts it was shared with, those that have left the catalog among them', () => {
    const allGone = sharedBuildPreview({
      language: 'en',
      shared: sharedOf(eight),
      parts: [],
      publicAddress,
    });

    expect(allGone.title).toBe('A shared Build of 8 Parts · PC Parts and Prices');
    expect(allGone.description).toBe(
      'A PC planned Part by Part. See its Parts, whether they work together, and what each Vendor charges for them.',
    );
    expect(allGone.openGraph).not.toHaveProperty('images');
  });

  it('names the CPU alone, the GPU alone, or neither, as the Build holds them', () => {
    const described = (parts: BuildPartResponse[]) =>
      sharedBuildPreview({
        language: 'en',
        shared: sharedOf(parts),
        parts,
        publicAddress,
      }).description;

    expect(described([cpu, board])).toBe(
      'A PC with the Made-up Ryzen 5 7600X. See its Parts, whether they work together, and what each Vendor charges for them.',
    );
    expect(described([gpu, theCase])).toBe(
      'A PC with the Made-up RTX 4070. See its Parts, whether they work together, and what each Vendor charges for them.',
    );
    expect(described([kit, drive])).toBe(
      'A PC planned Part by Part. See its Parts, whether they work together, and what each Vendor charges for them.',
    );
  });

  it('has no image when none of its Parts has a photo', () => {
    const preview = sharedBuildPreview({
      language: 'en',
      shared: sharedOf([cpu, theCase, psu]),
      parts: [cpu, theCase, psu],
      publicAddress,
    });

    expect(preview.openGraph).not.toHaveProperty('images');
  });
});

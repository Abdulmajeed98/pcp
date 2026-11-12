import { type Language, languages } from '@pcp/i18n';
import { describe, expect, it } from 'vitest';

import { pickerPreview } from '@/_pages/picker';

const publicAddress = 'https://parts.example';

// The picker's preview: the picker depends on the Build in the Shopper's
// cookie, so the page is marked for search engines not to index, and its
// preview is plain, a title in the page's language naming the Category,
// with no price (the builder spec's The Shopper's addresses).
describe("the picker's preview", () => {
  it.each<[Language, string, string]>([
    [
      'en',
      'Choose a CPU · PC Parts and Prices',
      'Choose a CPU for your Build among those Vendors have in stock now, lowest price first.',
    ],
    [
      'ckb',
      'پرۆسێسەرێک هەڵبژێرە · پارچە و نرخی کۆمپیوتەر',
      'پرۆسێسەرێک بۆ بیڵدەکەت هەڵبژێرە، لەوانەی فرۆشیاران ئێستا لە کۆگایان هەیە، کەمترین نرخ لە پێشەوە.',
    ],
    [
      'ar',
      'اختر معالجًا · قطع الحاسوب وأسعارها',
      'اختر معالجًا لتجميعتك من بين ما يتوفر لدى الباعة الآن، الأدنى سعرًا أولًا.',
    ],
  ])(
    'is titled in the page’s language, %s, naming the Category, with no price',
    (language, title, description) => {
      const preview = pickerPreview({ language, category: 'cpu', publicAddress });

      expect(preview.title).toBe(title);
      expect(preview.description).toBe(description);
      expect(preview.openGraph).toMatchObject({ title, description });
      expect(preview.openGraph).not.toHaveProperty('images');
    },
  );

  it('names each Category in its title and description', () => {
    const titles = (['cpuCooler', 'ram', 'storage', 'psu'] as const).map(
      (category) => pickerPreview({ language: 'en', category, publicAddress }).title,
    );
    expect(titles).toEqual([
      'Choose a CPU cooler · PC Parts and Prices',
      'Choose RAM · PC Parts and Prices',
      'Choose storage · PC Parts and Prices',
      'Choose a PSU · PC Parts and Prices',
    ]);
    expect(
      pickerPreview({ language: 'en', category: 'storage', publicAddress }).description,
    ).toBe(
      'Choose storage for your Build among those Vendors have in stock now, lowest price first.',
    );
  });

  it.each(languages)('is marked for search engines not to index, in %s', (language) => {
    expect(pickerPreview({ language, category: 'gpu', publicAddress }).robots).toEqual({
      index: false,
    });
  });

  it('names the picker in each language as its own address, whatever its query', () => {
    expect(
      pickerPreview({ language: 'ckb', category: 'cpuCooler', publicAddress }).alternates,
    ).toEqual({
      canonical: 'https://parts.example/ckb/build/cpu-cooler',
      languages: {
        ckb: 'https://parts.example/ckb/build/cpu-cooler',
        ar: 'https://parts.example/ar/build/cpu-cooler',
        en: 'https://parts.example/en/build/cpu-cooler',
        'x-default': 'https://parts.example/build/cpu-cooler',
      },
    });
  });
});

import { type Language, languages } from '@pcp/i18n';
import { describe, expect, it } from 'vitest';

import { buildPreview } from '@/_pages/build';

const publicAddress = 'https://parts.example';

// The Build page's preview: the Build depends on the Shopper's cookie, so the
// page is marked for search engines not to index, and its preview is plain,
// a title in the page's language with no Part and no price (the builder
// spec's The Shopper's addresses). A shared Build's preview is `sharing`'s.
describe("the Build page's preview", () => {
  it.each<[Language, string, string]>([
    [
      'en',
      'Your Build · PC Parts and Prices',
      'The PC Parts you have chosen, Category by Category, and what your Build still needs.',
    ],
    [
      'ckb',
      'بیڵدەکەت · پارچە و نرخی کۆمپیوتەر',
      'ئەو پارچانەی کۆمپیوتەر کە هەڵتبژاردوون، پۆل بە پۆل، و ئەوەی بیڵدەکەت هێشتا پێویستیەتی.',
    ],
    [
      'ar',
      'تجميعتك · قطع الحاسوب وأسعارها',
      'قطع الحاسوب التي اخترتها، فئة بعد فئة، وما لا تزال تجميعتك تحتاج إليه.',
    ],
  ])(
    'is titled in the page’s language, %s, with no Part and no price',
    (language, title, description) => {
      const preview = buildPreview({ language, publicAddress });

      expect(preview.title).toBe(title);
      expect(preview.description).toBe(description);
      expect(preview.openGraph).toMatchObject({ title, description });
      expect(preview.openGraph).not.toHaveProperty('images');
    },
  );

  it.each(languages)('is marked for search engines not to index, in %s', (language) => {
    expect(buildPreview({ language, publicAddress }).robots).toEqual({ index: false });
  });

  it('names the Build page in each language as its own address', () => {
    expect(buildPreview({ language: 'ckb', publicAddress }).alternates).toEqual({
      canonical: 'https://parts.example/ckb/build',
      languages: {
        ckb: 'https://parts.example/ckb/build',
        ar: 'https://parts.example/ar/build',
        en: 'https://parts.example/en/build',
        'x-default': 'https://parts.example/build',
      },
    });
  });
});

import { type Language, languages, shopperMessages } from '@pcp/i18n';
import { describe, expect, it } from 'vitest';

import { previewOf } from '@/shared/preview';

const publicAddress = 'https://parts.example';

// The home page's preview in a language, from that language's own words.
function homePreview(language: Language) {
  const { Preview, Site } = shopperMessages[language];
  return previewOf({
    language,
    path: '',
    title: Preview.home.title,
    description: Preview.home.description,
    siteName: Site.name,
    publicAddress,
  });
}

// A Category page's preview, at a path of its own.
function aPagePreview(language: Language) {
  return previewOf({
    language,
    path: '/categories/cpu-cooler',
    title: 'A title',
    description: 'A description',
    siteName: shopperMessages[language].Site.name,
    publicAddress,
  });
}

// Every page tells a search engine and a chat app, such as WhatsApp, what it
// is in its own language (BRW-5): its title and description, its canonical
// address, its addresses in the other two languages, and Open Graph's
// title, description, type, locale and site name.
describe("a page's preview", () => {
  describe.each(languages)('in %s', (language) => {
    const preview = homePreview(language);
    const { Preview, Site } = shopperMessages[language];

    it('has the title and the description in its language', () => {
      expect(preview.title).toBe(Preview.home.title);
      expect(preview.description).toBe(Preview.home.description);
    });

    it('names its canonical address in its language, on the public address', () => {
      expect(preview.alternates?.canonical).toBe(`${publicAddress}/${language}`);
    });

    it('names its addresses in the other two languages', () => {
      for (const other of languages.filter((each) => each !== language)) {
        expect(preview.alternates?.languages).toMatchObject({
          [other]: `${publicAddress}/${other}`,
        });
      }
    });

    it('gives Open Graph its title, description, type, locale and site name', () => {
      expect(preview.openGraph).toMatchObject({
        title: Preview.home.title,
        description: Preview.home.description,
        type: 'website',
        siteName: Site.name,
        url: `${publicAddress}/${language}`,
      });
    });

    // A preview a chat app keeps would show a price that has since changed
    // (story 60).
    it('holds no price in its description', () => {
      expect(preview.description).not.toMatch(/\d|IQD|\$|≈/);
    });

    it("writes another page's addresses with its path", () => {
      const page = aPagePreview(language);
      expect(page.alternates?.canonical).toBe(
        `${publicAddress}/${language}/categories/cpu-cooler`,
      );
      expect(page.alternates?.languages).toMatchObject({
        ckb: `${publicAddress}/ckb/categories/cpu-cooler`,
        ar: `${publicAddress}/ar/categories/cpu-cooler`,
        en: `${publicAddress}/en/categories/cpu-cooler`,
      });
    });
  });

  // Open Graph names a locale by its language and its country; the other two
  // languages are its alternate locales.
  it.each<[Language, string, string[]]>([
    ['ckb', 'ckb_IQ', ['ar_IQ', 'en_US']],
    ['ar', 'ar_IQ', ['ckb_IQ', 'en_US']],
    ['en', 'en_US', ['ckb_IQ', 'ar_IQ']],
  ])("names %s's locale for Open Graph", (language, locale, alternateLocale) => {
    expect(homePreview(language).openGraph).toMatchObject({ locale, alternateLocale });
  });

  it('tells search engines that the address with no language picks one', () => {
    expect(homePreview('en').alternates?.languages).toMatchObject({
      'x-default': `${publicAddress}/`,
    });
    expect(aPagePreview('en').alternates?.languages).toMatchObject({
      'x-default': `${publicAddress}/categories/cpu-cooler`,
    });
  });
});

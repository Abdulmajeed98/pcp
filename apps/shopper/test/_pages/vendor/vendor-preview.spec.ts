import type { VisibleVendorResponse } from '@pcp/api-client';
import { type Language, languages } from '@pcp/i18n';
import { describe, expect, it } from 'vitest';

import { vendorPreview } from '@/_pages/vendor';

const publicAddress = 'https://parts.example';

// A made-up Vendor, as the API answers it, named in Latin script.
const aVendor: VisibleVendorResponse = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Made-up PC Parts',
  city: 'erbil',
  address: '1 Made-up Street\nFictional Bazaar',
  mapLocation: { latitude: 36.1911, longitude: 44.0092 },
  phoneNumber: { international: '+9647500000001', national: '0750 000 0001' },
  whatsAppNumber: { international: '+9647500000002', national: '0750 000 0002' },
  instagramName: 'made.up.pc.parts',
  openingHours: 'Saturday to Thursday, 10:00 to 21:00\nFriday closed',
};

// The description of the made-up Vendor's page in each language, as a chat
// app shows it under the title (BRW-5): the shop and its city, named in the
// page's language, and what the page holds, with no price.
const descriptions: Record<Language, string> = {
  en: 'Made-up PC Parts, a Vendor in Erbil. How to call, message or find it, and every PC Part it offers now.',
  ckb: 'Made-up PC Parts، فرۆشیارێک لە هەولێر. چۆن پەیوەندی پێوە بکەیت، نامەی بۆ بنێریت یان بیدۆزیتەوە، و هەموو ئەو پارچانەی کۆمپیوتەر کە ئێستا ئۆفەری بۆیان هەیە.',
  ar: 'Made-up PC Parts، بائع في أربيل. كيف تتصل به أو تراسله أو تجده، وكل قطع الحاسوب التي يعرضها الآن.',
};

// A Vendor page's preview, what WhatsApp and a search engine show of its
// link (BRW-5), in the link's language: its title names the shop, and its
// description names the shop and its city. It never holds a price, which a
// chat app's copy would keep showing after it changed (story 60).
describe("a Vendor page's preview", () => {
  describe.each(languages)('in %s', (language) => {
    const preview = vendorPreview({ language, vendor: aVendor, publicAddress });

    it('has a title that names the shop, and the site', () => {
      expect(preview.title).toMatch(new RegExp(`^${aVendor.name} · `));
      expect(preview.openGraph?.title).toBe(preview.title);
    });

    it('describes the shop and its city, in the language of the page', () => {
      expect(preview.description).toBe(descriptions[language]);
      expect(preview.openGraph?.description).toBe(descriptions[language]);
    });

    it('holds no price, and no mark of one', () => {
      expect(preview.description).not.toMatch(/IQD|\$|≈|\d/);
    });

    it("names the Vendor page's address in its language as its canonical address, and its address in each language", () => {
      expect(preview.alternates?.canonical).toBe(
        `${publicAddress}/${language}/vendors/${aVendor.id}`,
      );
      expect(preview.alternates?.languages).toEqual({
        ckb: `${publicAddress}/ckb/vendors/${aVendor.id}`,
        ar: `${publicAddress}/ar/vendors/${aVendor.id}`,
        en: `${publicAddress}/en/vendors/${aVendor.id}`,
        'x-default': `${publicAddress}/vendors/${aVendor.id}`,
      });
      expect(preview.openGraph).toMatchObject({
        url: `${publicAddress}/${language}/vendors/${aVendor.id}`,
      });
    });

    it('gives Open Graph no image', () => {
      expect(preview.openGraph).not.toHaveProperty('images');
    });
  });

  it('names a Vendor written in Arabic script as it wrote its name', () => {
    const named = 'کۆگای پارچەی خەیاڵی';
    const preview = vendorPreview({
      language: 'en',
      vendor: { ...aVendor, name: named },
      publicAddress,
    });
    expect(preview.title).toBe(`${named} · PC Parts and Prices`);
    expect(preview.description).toMatch(new RegExp(`^${named}, a Vendor in Erbil\\.`));
  });
});

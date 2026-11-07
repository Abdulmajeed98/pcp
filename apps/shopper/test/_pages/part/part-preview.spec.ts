import type {
  ShownPriceResponse,
  VisibleOfferResponse,
  VisiblePartWithSpecificationsResponse,
} from '@pcp/api-client';
import { type Language, languages } from '@pcp/i18n';
import { describe, expect, it } from 'vitest';

import { partPreview } from '@/_pages/part';

const publicAddress = 'https://parts.example';

// A made-up Visible Part, as the API answers it.
const aCpu: VisiblePartWithSpecificationsResponse = {
  id: '00000000-0000-4000-8000-000000000012',
  category: 'cpu',
  name: 'Made-up Ryzen 7 7800X3D',
  manufacturer: 'Made-up Devices',
  partNumbers: ['100-100000910WOF'],
  photoPath: '/v1/photos/00000000-0000-4000-8000-000000000099',
  specifications: [],
};

function shown(amount: string, converted = false): ShownPriceResponse {
  return { currency: 'IQD', amount, converted };
}

// An Offer of a made-up Vendor, as the API answers it for the Part.
function anOffer(vendor: string, price: ShownPriceResponse): VisibleOfferResponse {
  return {
    usdPrice: null,
    iqdPrice: Number(price.amount),
    shownPrice: price,
    inStock: true,
    warrantyMonths: 12,
    confirmedAt: '2026-11-06T08:00:00.000Z',
    daysSinceConfirmation: 0,
    vendor: { id: vendor, name: vendor },
  };
}

// Twenty Vendors offer it, the lowest at 559,000 dinars, one converted.
const twentyOffers = Array.from({ length: 20 }, (_, place) =>
  anOffer(`Made-up Shop ${place + 1}`, shown(String(559_000 + place * 1000), place === 3)),
);

// The description of the made-up CPU's page with its twenty Offers, in each
// language, as a chat app shows it under the title (BRW-5): the Part, its
// Category and manufacturer, and how many Vendors offer it, and no price.
const descriptions: Record<Language, string> = {
  en: 'Made-up Ryzen 7 7800X3D, a CPU by Made-up Devices. 20 Vendors offer it, each price confirmed by its Vendor.',
  ckb: 'Made-up Ryzen 7 7800X3D، پرۆسێسەرێکی Made-up Devices. 20 فرۆشیار ئۆفەریان بۆ هەیە، هەر نرخێک فرۆشیارەکەی پشتڕاستی کردۆتەوە.',
  ar: 'Made-up Ryzen 7 7800X3D، معالج من Made-up Devices. يعرضها 20 بائعًا، وكل سعر أكّده بائعه.',
};

// A Part page's preview, what WhatsApp and a search engine show of its link
// (BRW-5, success criterion 12): in the link's language, its title names the
// Part, its description names the Part, its manufacturer and its Category,
// and counts the Vendors that offer it, and Open Graph's image is the
// Part's photo on the Shopper app's own address. It never holds a price,
// which a chat app's copy would keep showing after it changed (story 60).
describe("a Part page's preview", () => {
  describe.each(languages)('in %s', (language) => {
    const preview = partPreview({
      language,
      part: aCpu,
      offers: twentyOffers,
      publicAddress,
    });

    it('has a title that names the Part, and the site', () => {
      expect(preview.title).toMatch(new RegExp(`^${aCpu.name} · `));
      expect(preview.openGraph?.title).toBe(preview.title);
    });

    it('describes the Part, its Category and manufacturer, and how many Vendors offer it', () => {
      expect(preview.description).toBe(descriptions[language]);
      expect(preview.openGraph?.description).toBe(descriptions[language]);
    });

    it('holds no price, and no mark of one', () => {
      for (const { shownPrice } of twentyOffers) {
        const figure = Number(shownPrice?.amount).toLocaleString('en-US');
        expect(preview.description).not.toContain(figure);
        expect(preview.description).not.toContain(shownPrice?.amount);
      }
      expect(preview.description).not.toMatch(/IQD|\$|≈/);
    });

    it("names the Part page's address in its language as its canonical address", () => {
      expect(preview.alternates?.canonical).toBe(
        `${publicAddress}/${language}/parts/${aCpu.id}`,
      );
    });

    it("gives Open Graph the Part's photo on the Shopper app's public address", () => {
      expect(preview.openGraph?.images).toEqual([
        `${publicAddress}/photos/00000000-0000-4000-8000-000000000099`,
      ]);
    });
  });

  it('gives Open Graph no image for a Part with no photo', () => {
    const preview = partPreview({
      language: 'en',
      part: { ...aCpu, photoPath: null },
      offers: twentyOffers,
      publicAddress,
    });
    expect(preview.openGraph).not.toHaveProperty('images');
  });

  it('counts one Vendor as one', () => {
    const [one] = twentyOffers;
    expect(
      partPreview({ language: 'en', part: aCpu, offers: [one], publicAddress }).description,
    ).toBe(
      'Made-up Ryzen 7 7800X3D, a CPU by Made-up Devices. 1 Vendor offers it, each price confirmed by its Vendor.',
    );
    expect(
      partPreview({ language: 'ar', part: aCpu, offers: [one], publicAddress }).description,
    ).toBe(
      'Made-up Ryzen 7 7800X3D، معالج من Made-up Devices. يعرضها بائع واحد، وكل سعر أكّده بائعه.',
    );
  });

  it.each<[VisiblePartWithSpecificationsResponse['category'], string]>([
    ['cpuCooler', 'a CPU cooler'],
    ['motherboard', 'a motherboard'],
    ['ram', 'RAM'],
    ['storage', 'a storage drive'],
    ['gpu', 'a GPU'],
    ['case', 'a case'],
    ['psu', 'a PSU'],
  ])('names a Part of the %s Category as %s', (category, named) => {
    expect(
      partPreview({
        language: 'en',
        part: { ...aCpu, category },
        offers: twentyOffers,
        publicAddress,
      }).description,
    ).toContain(`, ${named} by Made-up Devices.`);
  });
});

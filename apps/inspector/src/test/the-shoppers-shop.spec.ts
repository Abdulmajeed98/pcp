import { describe, expect, it } from '@jest/globals';

import { theShoppersShop } from '../the-shoppers-shop.ts';
import {
  now,
  photosStandIn,
  theShoppersCatalogStandIn,
} from './shoppers-catalog-stand-in.ts';

const shop = theShoppersShop(now, theShoppersCatalogStandIn(), photosStandIn);

const arabicScript = /[؀-ۿ]/;
const latinScript = /[A-Za-z]/;

describe("the made-up shop's Vendors", () => {
  it('are several, named in Kurdish, Arabic and Latin script', () => {
    const names = shop.vendors.map((vendor) => vendor.name);

    expect(names.length).toBeGreaterThanOrEqual(20);
    expect(names).toContain('Made-up PC Parts');
    expect(names).toContain('کۆگای پارچەی خەیاڵی');
    expect(names).toContain('حاسبات المثال');
    expect(names.filter((name) => arabicScript.test(name)).length).toBeGreaterThan(4);
    expect(
      names.filter((name) => !arabicScript.test(name) && latinScript.test(name)).length,
    ).toBeGreaterThan(4);
  });

  it('mostly have every contact detail, and one has only its phone number', () => {
    const everyDetail = shop.vendors.filter(
      (vendor) =>
        vendor.mapLocation !== null &&
        vendor.whatsAppNumber !== null &&
        vendor.instagramName !== null &&
        vendor.openingHours !== null,
    );
    const onlyThePhone = shop.vendors.filter(
      (vendor) =>
        vendor.mapLocation === null &&
        vendor.whatsAppNumber === null &&
        vendor.instagramName === null &&
        vendor.openingHours === null,
    );

    expect(everyDetail.length).toBe(shop.vendors.length - 1);
    expect(onlyThePhone.map((vendor) => vendor.name)).toEqual(['Pretend Tech']);
  });
});

describe("the made-up shop's Offers", () => {
  const categoryOf = (partId: string) => shop.parts.get(partId)?.summary.category;
  const offersOf = (partId: string) =>
    shop.offers.filter((offer) => offer.partId === partId);

  it('cover all eight Categories, and every Vendor but one has some', () => {
    const categories = new Set(shop.offers.map((offer) => categoryOf(offer.partId)));
    const withoutOffers = shop.vendors.filter(
      (vendor) => !shop.offers.some((offer) => offer.vendorId === vendor.id),
    );

    expect([...categories].sort()).toEqual(
      ['case', 'cpu', 'cpuCooler', 'gpu', 'motherboard', 'psu', 'ram', 'storage'].sort(),
    );
    expect(withoutOffers.map((vendor) => vendor.name)).toEqual(['Imaginary Gaming Corner']);
  });

  it('are quoted in USD, in IQD and in both, with Shown Prices quoted and converted in each', () => {
    const quoted = (usd: boolean, iqd: boolean) =>
      shop.offers.filter(
        (offer) => (offer.usdPrice !== null) === usd && (offer.iqdPrice !== null) === iqd,
      );

    expect(quoted(true, false).length).toBeGreaterThan(5);
    expect(quoted(false, true).length).toBeGreaterThan(5);
    expect(quoted(true, true).length).toBeGreaterThan(5);
    expect(quoted(false, false)).toEqual([]);
    const inDollars = shop.offers.filter((offer) => offer.usdPrice !== null);
    const inDinars = shop.offers.filter((offer) => offer.iqdPrice !== null);
    for (const offer of shop.offers) {
      expect(offer.shownPrices.USD.converted).toBe(offer.usdPrice === null);
      expect(offer.shownPrices.IQD.converted).toBe(offer.iqdPrice === null);
    }
    expect(inDollars.map((offer) => offer.shownPrices.USD.amount)).toEqual(
      inDollars.map((offer) => offer.usdPrice),
    );
    expect(inDinars.map((offer) => offer.shownPrices.IQD.amount)).toEqual(
      inDinars.map((offer) => String(offer.iqdPrice)),
    );
  });

  it('are in stock and out of stock, with a warranty and without, and confirmed today, yesterday and 13 days ago', () => {
    const days = new Set(shop.offers.map((offer) => offer.daysSinceConfirmation));

    expect(shop.offers.some((offer) => offer.inStock)).toBe(true);
    expect(shop.offers.some((offer) => !offer.inStock)).toBe(true);
    expect(shop.offers.some((offer) => offer.warrantyMonths === null)).toBe(true);
    expect(shop.offers.some((offer) => offer.warrantyMonths !== null)).toBe(true);
    expect(days.has(0) && days.has(1) && days.has(13)).toBe(true);
    expect(Math.max(...days)).toBe(13);
  });

  it('make one Category offered by one Part, one with 400 Visible Parts, and one Part offered by 20 Vendors', () => {
    const partsOf = (category: string) =>
      [...shop.parts.values()].filter((read) => read.summary.category === category);
    const mostOffered = [...shop.parts.keys()]
      .map((partId) => offersOf(partId))
      .reduce((a, b) => (a.length >= b.length ? a : b));

    expect(partsOf('case').length).toBe(1);
    expect(partsOf('gpu').length).toBe(400);
    expect(mostOffered.length).toBe(20);
    expect(new Set(mostOffered.map((offer) => offer.vendorId)).size).toBe(20);
    expect(shop.parts.get(mostOffered[0].partId)?.summary.name).toBe('AMD Ryzen 7 7800X3D');
  });

  it("show the catalog's two longest names, the longest with a photo and the next without", () => {
    const [longest, next] = [...shop.parts.values()]
      .map((read) => read.summary)
      .sort((a, b) => b.name.length - a.name.length);

    expect(longest.name.length).toBe(276);
    expect(next.name.length).toBe(210);
    expect(longest.photoPath).toMatch(/^\/v1\/photos\/\S+$/);
    expect(next.photoPath).toBeNull();
  });

  it("are of the Parts the catalog gave, each held once, and each Offer's identifier its own", () => {
    const catalog = theShoppersCatalogStandIn();
    const given = new Set([
      ...[...catalog.named.values()].map((read) => read.summary.id),
      ...catalog.others.map((read) => read.summary.id),
    ]);

    for (const offer of shop.offers) {
      expect(given.has(offer.partId)).toBe(true);
      expect(shop.parts.has(offer.partId)).toBe(true);
    }
    expect(new Set(shop.offers.map((offer) => offer.id)).size).toBe(shop.offers.length);
  });
});

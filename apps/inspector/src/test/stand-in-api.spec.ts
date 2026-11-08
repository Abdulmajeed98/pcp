import { describe, expect, it } from '@jest/globals';
import type {
  BuildResponse,
  VisibleOfferOfVendorPageResponse,
  VisibleOfferResponse,
  VisiblePartPageResponse,
  VisiblePartsFiltersResponse,
  VisiblePartWithSpecificationsResponse,
} from '@pcp/api-client';

import {
  b650Tomahawk,
  barraCuda,
  type CatalogPart,
  core12100F,
  core14600K,
  dual2060Super,
  furyBeast16,
  nhD15,
  p3Plus,
  palit4070Super,
  rm850e,
  ryzen5600,
  ryzen7800X3D,
  samsung990Pro,
  theLongestName,
  theOnlyCase,
  tridentZ5,
  vengeance,
} from '../made-up-offers.ts';
import { madeUpIdentifier } from '../made-up-vendors.ts';
import { answerFromTheStandIn } from '../stand-in-api.ts';
import { theShoppersShop } from '../the-shoppers-shop.ts';
import {
  now,
  photosStandIn,
  theShoppersCatalogStandIn,
} from './shoppers-catalog-stand-in.ts';

const catalog = theShoppersCatalogStandIn();
const shop = theShoppersShop(now, catalog, photosStandIn);

function get(path: string) {
  return answerFromTheStandIn(shop, { method: 'GET', path });
}

// A named Part's identifier in the catalog's stand-in, and its summary as
// the shop holds it, with its made-up photo if it has one.
function idOf(part: CatalogPart): string {
  return catalog.named.get(part.name)?.summary.id ?? 'not a named Part';
}
function summaryOf(part: CatalogPart) {
  return shop.parts.get(idOf(part))?.summary;
}

// A Build read in a currency, each value of `part` as the API takes it.
function buildOf(currency: string, ...values: string[]) {
  const parts = values.map((value) => `&part=${encodeURIComponent(value)}`).join('');
  return get(`/v1/build?currency=${currency}${parts}`);
}

// The API's refusal of a parameter, as a whole.
function notValid(field: string) {
  return {
    errors: [
      {
        code: 'NOT_VALID',
        title: 'not_valid_title',
        detail: 'not_valid_details',
        additionalInformation: { field },
      },
    ],
  };
}

describe('the stand-in API', () => {
  describe("a Category's Visible Parts", () => {
    const listOf = (query: string) => get(`/v1/visible-parts?${query}`);
    const namesOf = (query: string) =>
      (listOf(query).body as VisiblePartPageResponse).content.map((part) => part.name);
    const cpus = (more = '') => namesOf(`category=cpu&currency=IQD&size=100${more}`);

    it('are listed with their Lowest Price, lowest first, and those every Vendor has out of stock last', () => {
      const page = listOf('category=cpu&currency=IQD&size=100')
        .body as VisiblePartPageResponse;
      const named = (name: string) => page.content.find((part) => part.name === name);

      expect(page.content.map((part) => part.name)).toEqual([
        'Intel Core i3 12100F',
        'AMD Ryzen 5 5600',
        'AMD Ryzen 5 7600X',
        'Intel Core i5 14600K',
        'Intel Core Ultra 7 265K',
        'AMD Ryzen 7 7800X3D',
        'Intel Core i7 14700K',
        'AMD Ryzen 7 9800X3D',
        'AMD Ryzen 9 7950X3D',
      ]);
      expect(named('AMD Ryzen 7 7800X3D')).toEqual({
        ...catalog.named.get('AMD Ryzen 7 7800X3D')?.summary,
        photoPath: expect.stringMatching(/^\/v1\/photos\//),
        lowestPrice: { currency: 'IQD', amount: '559000', converted: false },
        vendorCount: 20,
        inStock: true,
      });
      expect(named('Intel Core i7 14700K')?.lowestPrice).toEqual({
        currency: 'IQD',
        amount: '575000',
        converted: true,
      });
      expect(named('AMD Ryzen 9 7950X3D')).toMatchObject({
        lowestPrice: null,
        vendorCount: 1,
        inStock: false,
      });
    });

    it('have their Lowest Price in the currency asked', () => {
      const page = listOf('category=cpu&currency=USD&size=100')
        .body as VisiblePartPageResponse;

      expect(
        page.content.find((part) => part.name === 'AMD Ryzen 7 7800X3D')?.lowestPrice,
      ).toEqual({ currency: 'USD', amount: '355.00', converted: true });
    });

    it('come a page at a time', () => {
      const first = listOf('category=gpu&currency=IQD&size=20')
        .body as VisiblePartPageResponse;
      const last = listOf('category=gpu&currency=IQD&size=20&page=19')
        .body as VisiblePartPageResponse;

      expect(first).toMatchObject({
        pageNumber: 0,
        pageSize: 20,
        totalElements: 400,
        totalPages: 20,
        first: true,
        last: false,
      });
      expect(first.content.length).toBe(20);
      expect(last).toMatchObject({ pageNumber: 19, first: false, last: true });
      expect(last.content.length).toBe(20);
    });

    it('are searched by every word, in any order and any case, in the name, manufacturer and part numbers', () => {
      const partNumber =
        catalog.named.get('AMD Ryzen 5 5600')?.summary.partNumbers[0] ?? '';

      expect(cpus('&search=800x3d%20RYZEN')).toEqual([
        'AMD Ryzen 7 7800X3D',
        'AMD Ryzen 7 9800X3D',
      ]);
      expect(cpus(`&search=${partNumber.toLowerCase()}`)).toEqual(['AMD Ryzen 5 5600']);
      expect(cpus('&search=intel%20ryzen')).toEqual([]);
    });

    it('are picked by manufacturer, any of those asked', () => {
      expect(cpus('&manufacturer=Intel')).toEqual([
        'Intel Core i3 12100F',
        'Intel Core i5 14600K',
        'Intel Core Ultra 7 265K',
        'Intel Core i7 14700K',
      ]);
      expect(cpus('&manufacturer=Intel&manufacturer=AMD').length).toBe(9);
    });

    it('are picked by filter, any value of one filter and every filter asked', () => {
      expect(cpus('&socket=AM5&socket=LGA1851')).toEqual([
        'AMD Ryzen 5 7600X',
        'Intel Core Ultra 7 265K',
        'AMD Ryzen 7 7800X3D',
        'AMD Ryzen 7 9800X3D',
      ]);
      expect(cpus('&cores=6')).toEqual(['AMD Ryzen 5 5600', 'AMD Ryzen 5 7600X']);
      expect(cpus('&socket=AM5&cores=8')).toEqual([
        'AMD Ryzen 7 7800X3D',
        'AMD Ryzen 7 9800X3D',
      ]);
      expect(namesOf('category=cpuCooler&currency=IQD&waterCooled=true')).toEqual([
        'ARCTIC Liquid Freezer III Pro 360mm Black',
      ]);
    });

    it('are picked by a price range in the currency asked, both ends included, leaving out those with no Lowest Price', () => {
      expect(cpus('&lowest=115000&highest=298000')).toEqual([
        'Intel Core i3 12100F',
        'AMD Ryzen 5 5600',
        'AMD Ryzen 5 7600X',
      ]);
      expect(cpus('&lowest=500000')).toEqual([
        'Intel Core Ultra 7 265K',
        'AMD Ryzen 7 7800X3D',
        'Intel Core i7 14700K',
        'AMD Ryzen 7 9800X3D',
      ]);
      expect(namesOf('category=cpu&currency=USD&highest=89')).toEqual([
        'Intel Core i3 12100F',
        'AMD Ryzen 5 5600',
      ]);
    });

    it('are refused without a Category or a currency', () => {
      expect(listOf('currency=IQD').body).toEqual(notValid('category'));
      expect(listOf('category=chair&currency=IQD').body).toEqual(notValid('category'));
      expect(listOf('category=cpu').body).toEqual(notValid('currency'));
    });

    describe('for the picker', () => {
      const everyCpu = [
        'Intel Core i3 12100F',
        'AMD Ryzen 5 5600',
        'AMD Ryzen 5 7600X',
        'Intel Core i5 14600K',
        'Intel Core Ultra 7 265K',
        'AMD Ryzen 7 7800X3D',
        'Intel Core i7 14700K',
        'AMD Ryzen 7 9800X3D',
        'AMD Ryzen 9 7950X3D',
      ];
      const withTheBuild = (...parts: CatalogPart[]) =>
        parts.map((part) => `&part=${idOf(part)}`).join('');
      const cpusFor = (more: string) =>
        (
          listOf(`category=cpu&currency=IQD&size=100${more}`)
            .body as VisiblePartPageResponse
        ).content;

      it('are those some Vendor has in stock, in stock only, in the same order', () => {
        expect(cpus('&inStockOnly=true')).toEqual(everyCpu.slice(0, -1));
        expect(cpus('&inStockOnly=false')).toEqual(everyCpu);
      });

      it('each answer whether it is Compatible with the Build given, and leave out those that are not', () => {
        const listed = cpusFor(withTheBuild(b650Tomahawk));

        expect(listed.map((part) => part.name)).toEqual(
          everyCpu.filter((name) => name !== ryzen5600.name),
        );
        expect(listed.every((part) => part.compatible === true)).toBe(true);
      });

      it('keep those that are not Compatible with the switch, in their place, answering that they are not', () => {
        const listed = cpusFor(`${withTheBuild(b650Tomahawk)}&keepNotCompatible=true`);

        expect(listed.map((part) => [part.name, part.compatible])).toEqual(
          everyCpu.map((name) => [name, name !== ryzen5600.name]),
        );
      });

      it('are each judged in place of the Build’s Part of their Category', () => {
        expect(
          cpusFor(withTheBuild(ryzen5600, b650Tomahawk)).map((part) => part.name),
        ).toEqual(everyCpu.filter((name) => name !== ryzen5600.name));
      });

      it('answer nothing of being Compatible without a Build, with the switch or without', () => {
        for (const listed of [cpusFor(''), cpusFor('&keepNotCompatible=true')]) {
          expect(listed.map((part) => part.name)).toEqual(everyCpu);
          expect(listed.some((part) => 'compatible' in part)).toBe(false);
        }
      });

      it('come a page at a time once judged, counting only those kept', () => {
        const page = listOf(
          `category=cpu&currency=IQD&size=3&page=1&inStockOnly=true${withTheBuild(b650Tomahawk)}`,
        ).body as VisiblePartPageResponse;

        expect(page).toMatchObject({ totalElements: 7, totalPages: 3, pageNumber: 1 });
        expect(page.content.map((part) => part.name)).toEqual([
          'Intel Core Ultra 7 265K',
          'AMD Ryzen 7 7800X3D',
          'Intel Core i7 14700K',
        ]);
      });
    });
  });

  describe("a Category's filters", () => {
    const filtersOf = (query: string) =>
      get(`/v1/visible-parts/filters?${query}`).body as VisiblePartsFiltersResponse;

    it('offer the manufacturers and the values its Visible Parts hold, and the range of their Lowest Prices', () => {
      expect(filtersOf('category=cpu&currency=IQD')).toEqual({
        manufacturers: ['AMD', 'Intel'],
        filters: [
          {
            parameter: 'socket',
            kind: 'text',
            values: ['AM4', 'AM5', 'LGA1700', 'LGA1851'],
          },
          { parameter: 'cores', kind: 'number', values: [6, 8, 14, 20] },
        ],
        priceRange: { currency: 'IQD', lowest: '115000', highest: '755000' },
      });
      expect(filtersOf('category=cpu&currency=USD').priceRange).toEqual({
        currency: 'USD',
        lowest: '73.00',
        highest: '479.00',
      });
    });

    it('offer yes or no, and a number with its unit, leaving out a 0 that is not known', () => {
      expect(filtersOf('category=cpuCooler&currency=IQD').filters).toEqual([
        { parameter: 'waterCooled', kind: 'yesNo', values: [false, true] },
        { parameter: 'radiatorSize', kind: 'number', unit: 'mm', values: [360] },
      ]);
    });

    it('leave out a filter no Visible Part holds a value of', () => {
      expect(filtersOf('category=case&currency=IQD').filters).toEqual([]);
    });

    it('offer only what Parts some Vendor has in stock hold, in stock only', () => {
      expect(filtersOf('category=storage&currency=IQD').manufacturers).toContain('Western');
      expect(
        filtersOf('category=storage&currency=IQD&inStockOnly=true').manufacturers,
      ).not.toContain('Western');
    });

    it('are refused without a Category or a currency', () => {
      expect(get('/v1/visible-parts/filters?currency=IQD').body).toEqual(
        notValid('category'),
      );
      expect(get('/v1/visible-parts/filters?category=gpu').body).toEqual(
        notValid('currency'),
      );
    });
  });

  describe('a visible Vendor', () => {
    it('is answered with its details, a detail it has not given as null', () => {
      const answer = get(`/v1/visible-vendors/${madeUpIdentifier(4)}`);

      expect(answer.status).toBe(200);
      expect(answer.body).toEqual({
        id: '00000000-0000-4000-8000-000000000004',
        name: 'Pretend Tech',
        city: 'erbil',
        address: '4 Pretend Road, Erbil',
        mapLocation: null,
        phoneNumber: { international: '+9647501000004', national: '0750 100 0004' },
        whatsAppNumber: null,
        instagramName: null,
        openingHours: null,
      });
    });

    it('is not found when the shop holds no such Vendor, as the API answers one', () => {
      const answer = get(`/v1/visible-vendors/${madeUpIdentifier(99)}`);

      expect(answer.status).toBe(404);
      expect(answer.body).toEqual({
        errors: [
          {
            code: 'VENDOR_NOT_FOUND',
            title: 'vendor_not_found_title',
            detail: 'vendor_not_found_details',
          },
        ],
      });
      expect(answer.refused).toBeUndefined();
    });
  });

  describe("a visible Vendor's Offers", () => {
    const pretendTech = madeUpIdentifier(4);
    const offersPage = (query: string, vendorId = pretendTech) =>
      get(`/v1/visible-vendors/${vendorId}/offers?${query}`);
    const names = (body: unknown) =>
      (body as VisibleOfferOfVendorPageResponse).content.map((offer) => offer.part.name);

    it("are grouped by Category in the catalog's order, in stock first and then the lowest Shown Price, a page at a time", () => {
      const first = offersPage('currency=IQD&page=0&size=4');
      const second = offersPage('currency=IQD&page=1&size=4');

      expect(first.status).toBe(200);
      expect(first.body).toMatchObject({
        pageNumber: 0,
        pageSize: 4,
        totalElements: 7,
        totalPages: 2,
        first: true,
        last: false,
      });
      expect(names(first.body)).toEqual([
        'Intel Core i3 12100F',
        'AMD Ryzen 5 5600',
        'AMD Ryzen 7 7800X3D',
        'Deepcool AK620 Air 160mm Black / Silver',
      ]);
      expect(second.body).toMatchObject({ pageNumber: 1, first: false, last: true });
      expect(names(second.body)).toEqual([
        'ASRock B550M Pro4 AM4 DDR4 Micro ATX',
        'Samsung 870 Evo 1TB 2.5" SSD SATA',
        'MSI MAG A650BN Black ATX 650W Non-Modular 80+ Bronze Certified',
      ]);
    });

    it('each show its Shown Price in the currency asked, quoted or converted, and its Part', () => {
      const offerOf = (currency: string) =>
        (offersPage(`currency=${currency}&size=1`).body as VisibleOfferOfVendorPageResponse)
          .content[0];
      const part = catalog.named.get('Intel Core i3 12100F')?.summary;

      expect(offerOf('IQD')).toEqual({
        usdPrice: null,
        iqdPrice: 115000,
        shownPrice: { currency: 'IQD', amount: '115000', converted: false },
        inStock: true,
        warrantyMonths: null,
        confirmedAt: '2026-10-19T07:00:00.000Z',
        daysSinceConfirmation: 2,
        part,
      });
      expect(offerOf('USD').shownPrice).toEqual({
        currency: 'USD',
        amount: '73.00',
        converted: true,
      });
    });

    it('are none for a Vendor with no Visible Offer, which is still answered', () => {
      const answer = offersPage('currency=USD', madeUpIdentifier(5));

      expect(answer.status).toBe(200);
      expect(answer.body).toEqual({
        pageNumber: 0,
        pageSize: 10,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
        content: [],
      });
    });

    it('are not found for a Vendor the shop does not hold, and refused without a currency', () => {
      expect(offersPage('currency=IQD', madeUpIdentifier(99)).status).toBe(404);
      for (const query of ['', 'currency=EUR']) {
        const answer = offersPage(query);

        expect(answer.status).toBe(400);
        expect(answer.body).toEqual(notValid('currency'));
      }
    });
  });

  describe('a Visible Part', () => {
    const idOf = (name: string) => catalog.named.get(name)?.summary.id ?? 'unknown';
    const specificationsOf = (name: string) =>
      (get(`/v1/visible-parts/${idOf(name)}`).body as VisiblePartWithSpecificationsResponse)
        .specifications;

    it("is answered with its specifications, labelled, in the order of its Category's list", () => {
      const answer = get(`/v1/visible-parts/${idOf('AMD Ryzen 7 7800X3D')}`);

      expect(answer.status).toBe(200);
      expect(answer.body).toEqual({
        ...catalog.named.get('AMD Ryzen 7 7800X3D')?.summary,
        photoPath: expect.stringMatching(/^\/v1\/photos\/\S+$/),
        specifications: [
          { path: 'socket', label: 'Socket', kind: 'oneOf', unit: null, value: 'AM5' },
          {
            path: 'cores.total',
            label: 'Cores',
            kind: 'wholeNumber',
            unit: null,
            value: 8,
          },
          {
            path: 'cores.efficiency',
            label: 'Efficiency cores',
            kind: 'wholeNumber',
            unit: null,
            value: 0,
          },
          {
            path: 'specifications.tdp',
            label: 'TDP',
            kind: 'wholeNumber',
            unit: 'W',
            value: 120,
          },
          {
            path: 'specifications.memory.types',
            label: 'Memory types',
            kind: 'severalOf',
            unit: null,
            value: ['DDR5'],
          },
        ],
      });
    });

    it('leaves out what the Part does not hold, and a 0 where the list says 0 is not known', () => {
      expect(specificationsOf('AMD Ryzen 5 5600').map((each) => each.path)).toEqual([
        'socket',
        'cores.total',
      ]);
      expect(specificationsOf('Intel Core Ultra 7 265K').map((each) => each.path)).toEqual([
        'socket',
      ]);
    });

    it('answers a list of rows as the fields each row holds, and no rows as none', () => {
      const slots = (name: string) =>
        specificationsOf(name).find((each) => each.path === 'm2_slots');

      expect(slots('MSI MAG B650 TOMAHAWK WIFI AM5 DDR5 ATX')).toEqual({
        path: 'm2_slots',
        label: 'M.2 slots',
        kind: 'listOfRows',
        unit: null,
        value: [
          [
            { path: 'size', label: 'Size', kind: 'text', unit: null, value: '2280' },
            { path: 'key', label: 'Key', kind: 'text', unit: null, value: 'M' },
          ],
          [{ path: 'key', label: 'Key', kind: 'text', unit: null, value: 'E' }],
        ],
      });
      expect(slots('ASRock B550M Pro4 AM4 DDR4 Micro ATX')?.value).toEqual([]);
    });

    it('is not found when the shop does not offer it', () => {
      const answer = get('/v1/visible-parts/00000000-0000-4000-8000-999999999999');

      expect(answer.status).toBe(404);
      expect(answer.body).toEqual({
        errors: [
          {
            code: 'PART_NOT_FOUND',
            title: 'part_not_found_title',
            detail: 'part_not_found_details',
          },
        ],
      });
    });
  });

  describe("a Visible Part's Offers", () => {
    const ryzen = catalog.named.get('AMD Ryzen 7 7800X3D')?.summary.id ?? 'unknown';
    const offersIn = (currency: string) =>
      get(`/v1/parts/${ryzen}/offers?currency=${currency}`).body as VisibleOfferResponse[];
    const vendorsOf = (offers: VisibleOfferResponse[]) =>
      offers.map((offer) => offer.vendor.name);

    it('are every Visible Offer, in stock first, then the lowest Shown Price, then the most recent Confirmation', () => {
      const offers = offersIn('IQD');

      expect(offers.length).toBe(20);
      expect(vendorsOf(offers.slice(0, 3))).toEqual([
        'Pretend Tech',
        'Example Electronics Bazaar',
        'کۆمپیوتەری وەهمی',
      ]);
      expect(vendorsOf(offers.slice(-3))).toEqual([
        'دووکانی تاقیکردنەوە',
        'Placeholder Computers',
        'Demo Devices',
      ]);
      expect(offers.slice(-3).every((offer) => !offer.inStock)).toBe(true);
    });

    it('are ordered by their Shown Prices in the currency asked', () => {
      expect(vendorsOf(offersIn('USD').slice(0, 4))).toEqual([
        'Pretend Tech',
        'Example Electronics Bazaar',
        'حاسبات المثال',
        'کۆمپیوتەری وەهمی',
      ]);
    });

    it('each show its Vendor and its Shown Price', () => {
      expect(offersIn('IQD')[0]).toEqual({
        usdPrice: null,
        iqdPrice: 559000,
        shownPrice: { currency: 'IQD', amount: '559000', converted: false },
        inStock: true,
        warrantyMonths: null,
        confirmedAt: '2026-10-07T23:00:00.000Z',
        daysSinceConfirmation: 13,
        vendor: { id: madeUpIdentifier(4), name: 'Pretend Tech' },
      });
      expect(offersIn('USD')[0].shownPrice).toEqual({
        currency: 'USD',
        amount: '355.00',
        converted: true,
      });
    });

    it('are refused without a currency, and not found for a Part the shop does not offer', () => {
      expect(get(`/v1/parts/${ryzen}/offers`).body).toEqual(notValid('currency'));
      expect(get('/v1/parts/not-a-part/offers?currency=IQD').status).toBe(404);
    });
  });

  describe("the platform's figures", () => {
    it("are the shop's Vendors and Offers, every one counted, its Platform Rate of 1,575 and the 14 days an Offer stays current", () => {
      const answer = get('/v1/platform-figures');

      expect(answer.status).toBe(200);
      expect(answer.body).toEqual({
        activeVendorCount: 21,
        visibleOfferCount: 852,
        iqdPerUsd: 1575,
        daysAnOfferStaysCurrent: 14,
      });
      expect(answer.refused).toBeUndefined();
    });
  });

  describe("a Part's photo", () => {
    it("is answered as the API serves one, at the address the Part's answer gives", () => {
      const part = get(
        `/v1/visible-parts/${catalog.named.get('Corsair 4000D AIRFLOW Tempered Glass Mid-Tower ATX Case - Black')?.summary.id}`,
      ).body as VisiblePartWithSpecificationsResponse;
      const photo = get(part.photoPath ?? 'no photo');

      expect(photo.status).toBe(200);
      expect(photo.headers).toEqual({
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      });
      expect(photo.body).toEqual(Buffer.from('photo of a case'));
    });

    it('is not found when the shop holds no such photo', () => {
      const answer = get('/v1/photos/00000000-0000-4000-8000-999999999999');

      expect(answer.status).toBe(404);
      expect(answer.body).toEqual({
        errors: [
          {
            code: 'PHOTO_NOT_FOUND',
            title: 'photo_not_found_title',
            detail: 'photo_not_found_details',
          },
        ],
      });
    });
  });

  describe('a Build', () => {
    it('is empty with no Part, needing every Category, with no outcome, no Estimated power draw and no price', () => {
      const answer = get('/v1/build?currency=IQD');

      expect(answer.status).toBe(200);
      expect(answer.refused).toBeUndefined();
      expect(answer.body).toEqual({
        parts: [],
        complete: false,
        stillNeeded: [
          'cpu',
          'cpuCooler',
          'motherboard',
          'ram',
          'storage',
          'gpu',
          'case',
          'psu',
        ],
        cpuValuesNotKnown: [],
        outcomes: [],
        estimatedPowerDraw: null,
        totalAcrossVendors: null,
        vendors: [],
      });
    });

    it("holds its Parts in the catalog's order of Categories and then the Build's, each with its quantity, its Lowest Price times it and the Vendor it comes from", () => {
      const body = buildOf(
        'IQD',
        `${idOf(vengeance)}:2`,
        idOf(ryzen7800X3D),
        `${idOf(furyBeast16)}:1`,
        idOf(palit4070Super),
      ).body as BuildResponse;
      const iqd = (amount: string) => ({ currency: 'IQD', amount, converted: false });

      expect(body.parts).toEqual([
        {
          ...summaryOf(ryzen7800X3D),
          quantity: null,
          visible: true,
          unstocked: false,
          priceNotShown: false,
          lowestPrice: {
            shownPrice: iqd('559000'),
            timesQuantity: iqd('559000'),
            vendor: { id: madeUpIdentifier(4), name: 'Pretend Tech' },
          },
        },
        {
          ...summaryOf(vengeance),
          quantity: 2,
          visible: true,
          unstocked: false,
          priceNotShown: false,
          lowestPrice: {
            shownPrice: iqd('172000'),
            timesQuantity: iqd('344000'),
            vendor: { id: madeUpIdentifier(1), name: 'Made-up PC Parts' },
          },
        },
        {
          ...summaryOf(furyBeast16),
          quantity: 1,
          visible: true,
          unstocked: false,
          priceNotShown: false,
          lowestPrice: {
            shownPrice: iqd('48000'),
            timesQuantity: iqd('48000'),
            vendor: { id: madeUpIdentifier(2), name: 'کۆگای پارچەی خەیاڵی' },
          },
        },
        {
          ...summaryOf(palit4070Super),
          quantity: null,
          visible: true,
          unstocked: false,
          priceNotShown: false,
          lowestPrice: {
            shownPrice: iqd('925000'),
            timesQuantity: iqd('925000'),
            vendor: { id: madeUpIdentifier(3), name: 'حاسبات المثال' },
          },
        },
      ]);
    });

    it('has each Lowest Price in the currency asked, quoted or converted, and times its quantity in cents', () => {
      const [cpu, kit] = (
        buildOf('USD', idOf(ryzen7800X3D), `${idOf(vengeance)}:3`).body as BuildResponse
      ).parts;

      expect(cpu.lowestPrice).toEqual({
        shownPrice: { currency: 'USD', amount: '355.00', converted: true },
        timesQuantity: { currency: 'USD', amount: '355.00', converted: true },
        vendor: { id: madeUpIdentifier(4), name: 'Pretend Tech' },
      });
      expect(kit.lowestPrice?.timesQuantity).toEqual({
        currency: 'USD',
        amount: '327.00',
        converted: false,
      });
    });

    it('adds up each Lowest Price times its quantity into the total across Vendors, in the currency asked, marked converted when any is', () => {
      const values = [
        idOf(ryzen7800X3D),
        `${idOf(vengeance)}:2`,
        `${idOf(furyBeast16)}:1`,
        idOf(palit4070Super),
      ];
      const totalIn = (currency: string) =>
        (buildOf(currency, ...values).body as BuildResponse).totalAcrossVendors;

      expect(totalIn('IQD')).toEqual({
        currency: 'IQD',
        amount: '1876000',
        converted: false,
      });
      expect(totalIn('USD')).toEqual({
        currency: 'USD',
        amount: '1192.00',
        converted: true,
      });
    });

    it('holds an Unstocked Part, which every Vendor has out of stock, with no Lowest Price, and leaves it out of the total', () => {
      const body = buildOf('IQD', `${idOf(tridentZ5)}:1`, idOf(ryzen7800X3D))
        .body as BuildResponse;

      expect(body.parts[1]).toEqual({
        ...summaryOf(tridentZ5),
        quantity: 1,
        visible: true,
        unstocked: true,
        priceNotShown: false,
        lowestPrice: null,
      });
      expect(body.totalAcrossVendors).toEqual({
        currency: 'IQD',
        amount: '559000',
        converted: false,
      });
      expect(
        (buildOf('IQD', `${idOf(tridentZ5)}:1`).body as BuildResponse).totalAcrossVendors,
      ).toBe(null);
    });

    it('lists each Vendor with any of its Parts in stock, with its total, the Parts it has and those it lacks, never an Unstocked Part, those lacking fewest first and then the lowest total', () => {
      const [cpu, kit, pcCase] = [ryzen7800X3D, tridentZ5, theOnlyCase].map(idOf);
      const { vendors } = buildOf('IQD', cpu, `${kit}:1`, pcCase).body as BuildResponse;
      const iqd = (amount: string, converted = false) => ({
        currency: 'IQD',
        amount,
        converted,
      });

      expect(vendors.map((vendor) => vendor.name)).toEqual([
        'Made-up PC Parts',
        'Mock Hardware House',
        'Pretend Tech',
        'Example Electronics Bazaar',
        'کۆمپیوتەری وەهمی',
        'حاسبات المثال',
        'کۆگای پارچەی خەیاڵی',
        'متجر التجربة للإلكترونيات',
        'ئەلیکترۆنیاتی خەیاڵ',
        'تەکنەلۆجیای نموونە',
        'عالم الحاسوب الافتراضي',
        'Invented Components & Accessories Trading Company',
        'Sample Systems',
        'Not-a-Real PC Shop',
        'Fictional Circuits',
        'شركة التقنيات الوهمية لتجارة الحاسبات وملحقاتها',
        'Dummy Digital',
      ]);
      expect(vendors[0]).toEqual({
        id: madeUpIdentifier(1),
        name: 'Made-up PC Parts',
        total: iqd('710000'),
        partsInStock: [
          { partId: cpu, shownPrice: iqd('575000'), timesQuantity: iqd('575000') },
          { partId: pcCase, shownPrice: iqd('135000'), timesQuantity: iqd('135000') },
        ],
        partsLacked: [],
      });
      expect(vendors[2]).toEqual({
        id: madeUpIdentifier(4),
        name: 'Pretend Tech',
        total: iqd('559000'),
        partsInStock: [
          { partId: cpu, shownPrice: iqd('559000'), timesQuantity: iqd('559000') },
        ],
        partsLacked: [pcCase],
      });
      expect(vendors[7].total).toEqual(iqd('570250', true));
    });

    it('adds up each Shown Price times its quantity into a Vendor’s total', () => {
      const { vendors } = buildOf('USD', `${idOf(vengeance)}:3`).body as BuildResponse;

      expect(vendors).toEqual([
        {
          id: madeUpIdentifier(1),
          name: 'Made-up PC Parts',
          total: { currency: 'USD', amount: '327.00', converted: false },
          partsInStock: [
            {
              partId: idOf(vengeance),
              shownPrice: { currency: 'USD', amount: '109.00', converted: false },
              timesQuantity: { currency: 'USD', amount: '327.00', converted: false },
            },
          ],
          partsLacked: [],
        },
      ]);
    });

    it('orders the Vendors tied on their total by name, so that their order can differ between currencies', () => {
      const firstFourIn = (currency: string) =>
        (buildOf(currency, idOf(ryzen7800X3D)).body as BuildResponse).vendors
          .slice(0, 4)
          .map((vendor) => vendor.name);

      expect(firstFourIn('IQD')).toEqual([
        'Pretend Tech',
        'Example Electronics Bazaar',
        'کۆمپیوتەری وەهمی',
        'حاسبات المثال',
      ]);
      expect(firstFourIn('USD')).toEqual([
        'Pretend Tech',
        'Example Electronics Bazaar',
        'حاسبات المثال',
        'کۆمپیوتەری وەهمی',
      ]);
    });

    it("answers every rule's outcome as the Compatibility Rules judge it, and the Estimated power draw, or the TDP it lacks", () => {
      const [cpu, board] = [ryzen5600, b650Tomahawk].map(idOf);
      const body = buildOf('IQD', cpu, board).body as BuildResponse;

      expect(body.outcomes).toEqual([
        { rule: 1, outcome: 'problem', parts: [cpu, board], missing: [] },
      ]);
      expect(body.estimatedPowerDraw).toEqual({
        watts: null,
        missing: [
          { part: cpu, path: 'specifications.tdp', label: 'TDP', fieldLabel: null },
        ],
      });
    });

    it('names each missing specification of an unchecked rule by its English label, a field of a row by its list’s and its own', () => {
      const [cpu, cooler, board, gpu] = [
        ryzen7800X3D,
        theLongestName,
        b650Tomahawk,
        palit4070Super,
      ].map(idOf);
      const body = buildOf('IQD', gpu, board, cooler, cpu).body as BuildResponse;

      expect(body.outcomes).toEqual([
        { rule: 1, outcome: 'passes', parts: [cpu, board], missing: [] },
        {
          rule: 2,
          outcome: 'unchecked',
          parts: [],
          missing: [
            { part: cooler, path: 'cpu_sockets', label: 'CPU sockets', fieldLabel: null },
          ],
        },
        {
          rule: 8,
          outcome: 'unchecked',
          parts: [],
          missing: [
            {
              part: board,
              path: 'pcie_slots.1.lanes',
              label: 'PCIe slots',
              fieldLabel: 'Lanes',
            },
          ],
        },
      ]);
      expect(body.estimatedPowerDraw).toEqual({ watts: 440, missing: [] });
    });

    describe('is a Complete Build', () => {
      // A Build of the CPU given and a Part of each Category but the GPU and
      // the CPU cooler, or only those Categories given.
      const withoutGpuOrCooler = (cpu: CatalogPart) => [
        idOf(cpu),
        idOf(b650Tomahawk),
        `${idOf(vengeance)}:1`,
        `${idOf(samsung990Pro)}:1`,
        idOf(theOnlyCase),
        idOf(rm850e),
      ];
      const completenessOf = (values: string[]) => {
        const { complete, stillNeeded, cpuValuesNotKnown } = buildOf('IQD', ...values)
          .body as BuildResponse;
        return { complete, stillNeeded, cpuValuesNotKnown };
      };

      it('with a Part of every Category', () => {
        expect(
          completenessOf([
            ...withoutGpuOrCooler(ryzen7800X3D),
            idOf(nhD15),
            idOf(palit4070Super),
          ]),
        ).toEqual({ complete: true, stillNeeded: [], cpuValuesNotKnown: [] });
      });

      it('without a GPU when its CPU has integrated graphics, and without a CPU cooler when its CPU includes one', () => {
        expect(completenessOf(withoutGpuOrCooler(ryzen7800X3D))).toEqual({
          complete: false,
          stillNeeded: ['cpuCooler'],
          cpuValuesNotKnown: [],
        });
        expect(completenessOf(withoutGpuOrCooler(ryzen5600))).toEqual({
          complete: false,
          stillNeeded: ['gpu'],
          cpuValuesNotKnown: [],
        });
        expect(
          completenessOf([...withoutGpuOrCooler(ryzen5600), idOf(dual2060Super)]),
        ).toEqual({ complete: true, stillNeeded: [], cpuValuesNotKnown: [] });
      });

      it('only with both when its CPU does not hold the values, which it says are not known', () => {
        expect(completenessOf(withoutGpuOrCooler(core12100F))).toEqual({
          complete: false,
          stillNeeded: ['cpuCooler', 'gpu'],
          cpuValuesNotKnown: ['integratedGraphics', 'includesCooler'],
        });
        expect(completenessOf(withoutGpuOrCooler(core14600K))).toEqual({
          complete: false,
          stillNeeded: ['cpuCooler'],
          cpuValuesNotKnown: ['includesCooler'],
        });
      });

      it('not without a CPU, needing a GPU and a CPU cooler too, kits and drives counting once however many', () => {
        expect(
          completenessOf([
            idOf(b650Tomahawk),
            `${idOf(vengeance)}:2`,
            `${idOf(furyBeast16)}:1`,
            `${idOf(samsung990Pro)}:1`,
            `${idOf(p3Plus)}:3`,
            `${idOf(barraCuda)}:1`,
            idOf(theOnlyCase),
            idOf(rm850e),
          ]),
        ).toEqual({
          complete: false,
          stillNeeded: ['cpu', 'cpuCooler', 'gpu'],
          cpuValuesNotKnown: [],
        });
      });
    });

    it('leaves out a Part the shop does not offer, as the API leaves out one the catalog does not hold', () => {
      const body = buildOf(
        'IQD',
        '00000000-0000-4000-8000-999999999999',
        idOf(ryzen7800X3D),
      ).body as BuildResponse;

      expect(body.parts.map((part) => part.name)).toEqual([ryzen7800X3D.name]);
    });

    it('is refused without a currency, or with a value of `part` that names no Part', () => {
      expect(get('/v1/build').body).toEqual(notValid('currency'));
      expect(buildOf('IQD', `${idOf(vengeance)}:two`).body).toEqual(notValid('part'));
    });
  });

  describe('what it does not answer', () => {
    it('refuses every write, whatever its address, and says why', () => {
      for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
        for (const path of [
          `/v1/visible-vendors/${madeUpIdentifier(2)}`,
          '/v1/vendors',
          '/v1/platform-rate',
        ]) {
          const answer = answerFromTheStandIn(shop, { method, path });

          expect(answer.status).toBe(405);
          expect(answer.refused).toBe('a write, which the made-up shop never takes');
        }
      }
    });

    it('refuses every other read, the API status and the Admin endpoints among them, and says why', () => {
      for (const path of [
        '/v1/status',
        '/v1/vendors',
        `/v1/vendors/${madeUpIdentifier(2)}`,
        '/v1/parts?search=ryzen',
        '/v1/platform-rate',
        '/v1/caller',
        '/v1/visible-vendors',
        '/visible-parts',
        '/',
      ]) {
        const answer = get(path);

        expect(answer.status).toBe(404);
        expect(answer.refused).toBe(
          'not one of the public endpoints the Shopper app reads, which alone the stand-in answers',
        );
      }
    });
  });
});

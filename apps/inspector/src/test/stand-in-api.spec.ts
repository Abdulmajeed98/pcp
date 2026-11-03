import { describe, expect, it } from '@jest/globals';
import type {
  VisibleOfferOfVendorPageResponse,
  VisibleOfferResponse,
  VisiblePartPageResponse,
  VisiblePartsFiltersResponse,
  VisiblePartWithSpecificationsResponse,
} from '@pcp/api-client';

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

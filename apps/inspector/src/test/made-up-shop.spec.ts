import { describe, expect, it } from '@jest/globals';
import type { VendorsOffersPageResponse } from '@pcp/api-client';

import {
  answerFromTheMadeUpShop,
  catalogSearchOfTheShop,
  listsTheVendors,
  partsWithTheShopsOffers,
  vendorsWithTheShops,
} from '../made-up-shop.ts';
import { aShopFromTheCatalog, now } from './catalog-stand-in.ts';

const shop = aShopFromTheCatalog();
const vendorId = shop.vendor.id;

const aDay = 24 * 60 * 60 * 1000;

function offersPage(
  { search = '', state = '', at = now, page = 0, size = 50 } = {} as {
    search?: string;
    state?: string;
    at?: Date;
    page?: number;
    size?: number;
  },
): VendorsOffersPageResponse {
  const query =
    (search === '' ? '' : `&search=${encodeURIComponent(search)}`) +
    (state === '' ? '' : `&state=${state}`);
  const answer = answerFromTheMadeUpShop(shop, at, {
    method: 'GET',
    path: `/v1/vendors/${vendorId}/offers?page=${page}&size=${size}${query}`,
  });
  expect(answer?.status).toBe(200);
  return answer?.body as VendorsOffersPageResponse;
}

// The Offer confirmed last, as the list shows it at a moment that long after
// its Confirmation.
function lastConfirmedOfferAfter(milliseconds: number) {
  const latest = shop.offers.reduce((a, b) => (a.confirmedAt > b.confirmedAt ? a : b));
  const at = new Date(new Date(latest.confirmedAt).getTime() + milliseconds);
  return offersPage({ at }).content.find((offer) => offer.id === latest.id);
}

describe("the made-up shop's Offers", () => {
  it('hold at least one Offer in each state a Vendor can see', () => {
    const offers = offersPage().content;
    const confirmedToday = offers.filter((offer) => offer.daysSinceConfirmation === 0);
    const olderAndCurrent = offers.filter(
      (offer) => offer.daysSinceConfirmation > 0 && !offer.expired && !offer.aboutToExpire,
    );

    expect(confirmedToday.length).toBeGreaterThan(0);
    expect(olderAndCurrent.length).toBeGreaterThan(0);
    expect(offers.some((offer) => offer.aboutToExpire)).toBe(true);
    expect(offers.some((offer) => offer.expired)).toBe(true);
    expect(offers.some((offer) => !offer.inStock)).toBe(true);
    expect(offers.some((offer) => offer.warrantyMonths === null)).toBe(true);
    expect(offers.length).toBeGreaterThanOrEqual(10);
    expect(offers.length).toBeLessThanOrEqual(14);
  });

  it("show an Offer's age and expiry by the API's rules of 14 days and 3 of warning", () => {
    expect(lastConfirmedOfferAfter(11 * aDay)).toMatchObject({
      daysSinceConfirmation: 11,
      daysLeft: 3,
      aboutToExpire: false,
      expired: false,
    });
    expect(lastConfirmedOfferAfter(11 * aDay + 1)).toMatchObject({
      daysLeft: 2,
      aboutToExpire: true,
      expired: false,
    });
    expect(lastConfirmedOfferAfter(14 * aDay)).toMatchObject({
      daysSinceConfirmation: 14,
      daysLeft: 0,
      aboutToExpire: true,
      expired: false,
    });
    expect(lastConfirmedOfferAfter(14 * aDay + 1)).toMatchObject({
      daysLeft: 0,
      aboutToExpire: false,
      expired: true,
    });
  });

  it('are counted whatever the search, which keeps the Offers whose Part holds every word', () => {
    const page = offersPage({ search: 'rtx super' });

    expect(page.content.map((offer) => offer.part.name).sort()).toEqual([
      'NVIDIA GeForce RTX 4070 SUPER 12GB GDDR6X Founders Edition',
      'Palit Dual OC GeForce RTX 4070 SUPER 12GB GDDR6X Black',
    ]);
    expect(page.totalElements).toBe(2);
    expect(page.counts).toEqual(offersPage().counts);
  });

  it('are found by state, those that need confirming or those out of stock, and the out of stock are counted', () => {
    const all = offersPage().content;
    const needConfirming = offersPage({ state: 'needs-confirming' });
    const outOfStock = offersPage({ state: 'out-of-stock' });

    expect(needConfirming.content.map((offer) => offer.id)).toEqual(
      all.filter((offer) => offer.expired || offer.aboutToExpire).map((offer) => offer.id),
    );
    expect(needConfirming.content.length).toBe(5);
    expect(outOfStock.content.map((offer) => offer.id)).toEqual(
      all.filter((offer) => !offer.inStock).map((offer) => offer.id),
    );
    expect(outOfStock.content.length).toBe(3);
    expect(offersPage({ state: 'all' }).content).toEqual(all);
    expect(outOfStock.counts).toEqual({
      offers: all.length,
      expired: 2,
      aboutToExpire: 3,
      outOfStock: 3,
    });
    expect(needConfirming.counts).toEqual(offersPage().counts);
  });

  it('come a page at a time, oldest Confirmation first', () => {
    const first = offersPage({ size: 5 });
    const all = offersPage().content;
    const lastPage = offersPage({ size: 5, page: first.totalPages - 1 });

    expect(first).toMatchObject({ pageNumber: 0, pageSize: 5, first: true, last: false });
    expect(first.totalPages).toBe(Math.ceil(all.length / 5));
    expect(first.content.map((offer) => offer.id)).toEqual(
      all.slice(0, 5).map((offer) => offer.id),
    );
    expect(lastPage).toMatchObject({ first: false, last: true });
    expect(lastPage.content.length).toBe(all.length - (first.totalPages - 1) * 5);
    const ages = all.map((offer) => offer.daysSinceConfirmation);
    expect(ages).toEqual([...ages].sort((a, b) => b - a));
  });
});

function answerTo(method: string, path: string) {
  return answerFromTheMadeUpShop(shop, now, { method, path });
}

describe("the made-up shop's Vendor", () => {
  const realVendor = (name: string, id: string) => ({
    id,
    name,
    loginPhoneNumber: { international: '+9647700000000', national: '0770 000 0000' },
    active: true,
  });
  const theShopsRow = {
    id: vendorId,
    name: shop.vendor.name,
    loginPhoneNumber: shop.vendor.loginPhoneNumber,
    active: true,
  };

  it("is listed among the API's Vendors, in name order on the first page, and counted with them", () => {
    const call = { method: 'GET', path: '/v1/vendors?page=0&size=20' };
    const apis = {
      pageNumber: 0,
      pageSize: 20,
      totalElements: 2,
      totalPages: 1,
      first: true,
      last: true,
      content: [
        realVendor('Made-up test Vendor A', 'real-a'),
        realVendor('Made-up test Vendor B', 'real-b'),
      ],
    };

    expect(answerTo(call.method, call.path)).toBeUndefined();
    expect(listsTheVendors(call)).toBe(true);
    expect(vendorsWithTheShops(shop, { status: 200, body: apis })).toEqual({
      status: 200,
      body: {
        ...apis,
        totalElements: 3,
        content: [apis.content[0], theShopsRow, apis.content[1]].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      },
    });
    expect(
      vendorsWithTheShops(shop, { status: 200, body: { ...apis, content: [] } }).body,
    ).toMatchObject({ content: [theShopsRow] });
    expect(answerTo('GET', `/v1/vendors/${vendorId}`)).toEqual({
      status: 200,
      body: shop.vendor,
    });
  });

  it("is listed alone when the API holds no Vendor, and is only counted on the API's later pages", () => {
    const empty = {
      pageNumber: 0,
      pageSize: 20,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
      content: [],
    };
    const later = {
      pageNumber: 1,
      pageSize: 20,
      totalElements: 21,
      totalPages: 2,
      first: false,
      last: true,
      content: [realVendor('Made-up test Vendor Z', 'real-z')],
    };

    expect(vendorsWithTheShops(shop, { status: 200, body: empty })).toEqual({
      status: 200,
      body: { ...empty, totalElements: 1, totalPages: 1, content: [theShopsRow] },
    });
    expect(vendorsWithTheShops(shop, { status: 200, body: later })).toEqual({
      status: 200,
      body: { ...later, totalElements: 22 },
    });
  });

  it("leaves the API's refusal of the list as it is", () => {
    const refused = { status: 401, body: { errors: [] } };

    expect(vendorsWithTheShops(shop, refused)).toBe(refused);
  });

  it("is the Caller's own Vendor", () => {
    expect(answerTo('GET', '/v1/caller/vendor')).toEqual({
      status: 200,
      body: shop.vendor,
    });
  });

  it('leaves any other Vendor, and its Offers, to the API, which only reads them; nothing is written to one', () => {
    const other = '11111111-1111-4111-8111-111111111111';

    expect(answerTo('GET', `/v1/vendors/${other}`)).toBeUndefined();
    expect(answerTo('GET', `/v1/vendors/${other}/offers?page=0&size=20`)).toBeUndefined();
    expect(answerTo('POST', `/v1/vendors/${other}/password`)?.status).toBe(405);
    expect(listsTheVendors({ method: 'GET', path: `/v1/vendors/${other}` })).toBe(false);
    expect(listsTheVendors({ method: 'POST', path: '/v1/vendors' })).toBe(false);
  });
});

describe("the made-up shop's other answers", () => {
  it('give one Offer by its identifier as the shop holds it, with its expiry at the moment it is read, as its list shows it', () => {
    const offer = shop.offers[0];
    const listed = offersPage().content.find((each) => each.id === offer.id);

    expect(listed).toMatchObject(offer);
    expect(answerTo('GET', `/v1/vendors/${vendorId}/offers/${offer.id}`)).toEqual({
      status: 200,
      body: listed,
    });
    expect(
      answerTo(
        'GET',
        `/v1/vendors/${vendorId}/offers/11111111-1111-4111-8111-111111111111`,
      ),
    ).toMatchObject({ status: 404, body: { errors: [{ code: 'OFFER_NOT_FOUND' }] } });
  });

  it("search the catalog for the shop's Vendor as the API's own search, every Part the shop offers marked with its Offer", () => {
    const offered = shop.offers[1];
    const other = { ...offered.part, id: '22222222-2222-4222-8222-222222222222' };
    const call = {
      method: 'GET',
      path: `/v1/parts?vendorId=${vendorId}&page=0&size=20&search=ryzen`,
    };
    const apis = {
      pageNumber: 0,
      pageSize: 20,
      totalElements: 2,
      totalPages: 1,
      first: true,
      last: true,
      content: [
        { ...offered.part, offerId: null },
        { ...other, offerId: null },
      ],
    };

    expect(answerTo(call.method, call.path)).toBeUndefined();
    expect(catalogSearchOfTheShop(shop, call)).toBe(
      '/v1/parts?page=0&size=20&search=ryzen',
    );
    expect(partsWithTheShopsOffers(shop, { status: 200, body: apis })).toEqual({
      status: 200,
      body: {
        ...apis,
        content: [
          { ...offered.part, offerId: offered.id },
          { ...other, offerId: null },
        ],
      },
    });
    expect(
      catalogSearchOfTheShop(shop, {
        method: 'GET',
        path: '/v1/parts?vendorId=real-a&page=0',
      }),
    ).toBeUndefined();
    expect(
      catalogSearchOfTheShop(shop, { method: 'GET', path: '/v1/parts?page=0' }),
    ).toBeUndefined();
    expect(
      catalogSearchOfTheShop(shop, {
        method: 'POST',
        path: `/v1/parts?vendorId=${vendorId}`,
      }),
    ).toBeUndefined();
  });

  it("list the shop among the Vendors with expiring Offers, with the list's counts", () => {
    const answer = answerTo('GET', '/v1/offers/expiring?page=0&size=20');

    expect(answer).toEqual({
      status: 200,
      body: {
        pageNumber: 0,
        pageSize: 20,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
        content: [
          {
            id: vendorId,
            name: shop.vendor.name,
            phoneNumber: shop.vendor.phoneNumber,
            whatsAppNumber: shop.vendor.whatsAppNumber,
            counts: {
              offers: offersPage().counts.offers,
              expired: offersPage().counts.expired,
              aboutToExpire: offersPage().counts.aboutToExpire,
            },
          },
        ],
      },
    });
  });

  it.each([
    ['POST', '/v1/vendors'],
    ['PUT', `/v1/vendors/${vendorId}`],
    ['PUT', `/v1/vendors/${vendorId}/contact-details`],
    ['POST', `/v1/vendors/${vendorId}/reset-password`],
    ['POST', `/v1/vendors/${vendorId}/deactivate`],
    ['POST', `/v1/vendors/${vendorId}/offers`],
    ['POST', `/v1/vendors/${vendorId}/offers/confirm`],
    ['PUT', `/v1/vendors/${vendorId}/offers/${shop.offers[0].id}`],
    ['DELETE', `/v1/vendors/${vendorId}/offers/${shop.offers[0].id}`],
    // Nothing is written to the development database, the catalog included
    // (redesign ticket 01): every call but a read is refused, whatever it is
    // about.
    ['POST', '/v1/parts'],
    ['PUT', '/v1/parts/11111111-1111-4111-8111-111111111111'],
    ['POST', '/v1/parts/11111111-1111-4111-8111-111111111111/photo'],
    ['PUT', '/v1/vendors/11111111-1111-4111-8111-111111111111'],
    ['PATCH', '/v1/categories'],
  ])('refuse a change, %s %s, which never reaches the API', (method, path) => {
    const answer = answerTo(method, path);

    expect(answer?.status).toBe(405);
    expect(answer?.body).toMatchObject({ errors: [{ code: 'MADE_UP_SHOP_IS_READ_ONLY' }] });
  });

  it.each([
    ['GET', '/v1/caller'],
    ['GET', '/v1/categories'],
    ['GET', '/v1/parts?page=0&size=20&search=ryzen'],
    ['GET', '/v1/parts/11111111-1111-4111-8111-111111111111'],
  ])('leave %s %s to the API', (method, path) => {
    expect(answerTo(method, path)).toBeUndefined();
  });
});

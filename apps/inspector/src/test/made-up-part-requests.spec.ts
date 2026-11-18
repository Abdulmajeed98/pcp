import { describe, expect, it } from '@jest/globals';
import type {
  OpenPartRequestsPageResponse,
  PartRequestWithVendorResponse,
  VendorsPartRequestsPageResponse,
} from '@pcp/api-client';

import { answerFromTheMadeUpShop, madeUpShop } from '../made-up-shop.ts';
import { madeUpIdentifier } from '../made-up-vendors.ts';
import { aShopFromTheCatalog, catalogPartsOfTheShop, now } from './catalog-stand-in.ts';

const shop = aShopFromTheCatalog();
const vendorId = shop.vendor.id;

const aDay = 24 * 60 * 60 * 1000;

function answerTo(method: string, path: string) {
  return answerFromTheMadeUpShop(shop, now, { method, path });
}

function theQueue(page = 0, size = 100): OpenPartRequestsPageResponse {
  const answer = answerTo('GET', `/v1/part-requests?page=${page}&size=${size}`);
  expect(answer?.status).toBe(200);
  return answer?.body as OpenPartRequestsPageResponse;
}

function theShopsList(page = 0, size = 100): VendorsPartRequestsPageResponse {
  const answer = answerTo(
    'GET',
    `/v1/vendors/${vendorId}/part-requests?page=${page}&size=${size}`,
  );
  expect(answer?.status).toBe(200);
  return answer?.body as VendorsPartRequestsPageResponse;
}

// One request as the shop answers it at a moment.
function oneRequestAt(moment: Date, id: string): PartRequestWithVendorResponse {
  const answer = answerFromTheMadeUpShop(shop, moment, {
    method: 'GET',
    path: `/v1/part-requests/${id}`,
  });
  expect(answer?.status).toBe(200);
  return answer?.body as PartRequestWithVendorResponse;
}

// The Admin console's Part Requests screen: the queue of open Part Requests
// of every Vendor (the part-requests spec's The inspector).
describe("the made-up shop's queue of Part Requests", () => {
  it("holds open Part Requests of the shop's Vendor and of other Vendors, a deactivated one among them, oldest first", () => {
    const { content } = theQueue();

    expect(content.length).toBeGreaterThan(5);
    expect(content.every((request) => request.state === 'open')).toBe(true);
    expect(content.some((request) => request.vendor.id === vendorId)).toBe(true);
    expect(new Set(content.map((request) => request.vendor.id)).size).toBeGreaterThan(3);
    expect(content.filter((request) => !request.vendor.active)).toEqual([
      expect.objectContaining({
        vendor: {
          id: madeUpIdentifier(5),
          name: 'Imaginary Gaming Corner',
          active: false,
        },
      }),
    ]);
    const sent = content.map((request) => request.sentAt);
    expect(sent).toEqual([...sent].sort());
  });

  it('comes a page at a time, as the API pages it', () => {
    const all = theQueue().content;
    const first = theQueue(0, 5);
    const second = theQueue(1, 5);

    expect(first).toMatchObject({
      pageNumber: 0,
      pageSize: 5,
      totalElements: all.length,
      totalPages: Math.ceil(all.length / 5),
      first: true,
      last: all.length <= 5,
    });
    expect([...first.content, ...second.content]).toEqual(all.slice(0, 10));
  });
});

// The Vendor portal's list of the shop's own Part Requests.
describe("the made-up shop's Vendor's Part Requests", () => {
  it('are its own, in every state, newest first, with no Vendor named', () => {
    const { content } = theShopsList();

    expect(content.map((request) => request.state)).toEqual([
      'open',
      'open',
      'fulfilled',
      'rejected',
      'fulfilled',
      'open',
    ]);
    expect(content.every((request) => !('vendor' in request))).toBe(true);
    const sent = content.map((request) => request.sentAt);
    expect(sent).toEqual([...sent].sort().reverse());
  });

  it('come a page at a time, as the API pages them', () => {
    const first = theShopsList(0, 4);
    const second = theShopsList(1, 4);

    expect(first).toMatchObject({
      pageNumber: 0,
      pageSize: 4,
      totalElements: 6,
      totalPages: 2,
      first: true,
      last: false,
    });
    expect(second).toMatchObject({ pageNumber: 1, first: false, last: true });
    expect([...first.content, ...second.content]).toEqual(theShopsList().content);
  });

  it('say how long an open one has waited, and whether its Offer would be expired, one of them sent 40 days ago', () => {
    const open = theShopsList().content.filter((request) => request.state === 'open');

    expect(open.map((request) => request.daysSinceSent)).toEqual([0, 3, 40]);
    expect(open.map((request) => request.offerWouldBeExpired)).toEqual([
      false,
      false,
      true,
    ]);
  });

  it('name the Part a fulfilled one was matched to, with the Offer the shop holds for it, or none once removed', () => {
    const fulfilled = theShopsList().content.filter(
      (request) => request.state === 'fulfilled',
    );
    const tuf = shop.offers.find(
      (offer) =>
        offer.part.name === 'Asus TUF GAMING OC Radeon RX 7800 XT 16GB GDDR6 Black',
    );

    expect(tuf?.id).toBe(madeUpIdentifier(108));
    expect(fulfilled).toEqual([
      expect.objectContaining({
        name: 'ASUS TUF Gaming RX 7800 XT OC 16GB',
        part: tuf?.part,
        offerId: madeUpIdentifier(108),
        resolvedAt: expect.any(String),
      }),
      expect.objectContaining({
        name: 'Ryzen 7 9800X3D tray',
        part: expect.objectContaining({ name: 'AMD Ryzen 7 9800X3D', category: 'cpu' }),
        offerId: null,
        resolvedAt: expect.any(String),
      }),
    ]);
  });

  it('give a rejected one its reason as the Admin wrote it, a long one', () => {
    const [rejected] = theShopsList().content.filter(
      (request) => request.state === 'rejected',
    );

    expect(rejected.reason?.length).toBeGreaterThan(200);
    expect(rejected.reason).toMatch(/^The part number SB650ME-WIFI matches no board/);
    expect(rejected.resolvedAt).toEqual(expect.any(String));
    expect(rejected).not.toHaveProperty('part');
  });

  it("leave another Vendor's Part Requests to the API", () => {
    expect(
      answerTo('GET', `/v1/vendors/${madeUpIdentifier(2)}/part-requests?page=0&size=20`),
    ).toBeUndefined();
  });
});

describe("the made-up shop's days", () => {
  // The day in Iraq's time, three hours ahead of UTC all year: a request
  // sent at 07:00 UTC was sent that day there until 20:59:59.999 UTC, and
  // a day before from 21:00 UTC.
  it("count a request's day and the days since it in Iraq's time, as the API does", () => {
    const newest = theQueue().content.at(-1);

    expect(newest?.sentAt).toBe('2026-10-21T07:00:00.000Z');
    expect(
      oneRequestAt(new Date('2026-10-21T20:59:59.999Z'), newest?.id ?? ''),
    ).toMatchObject({
      sentOn: '2026-10-21',
      daysSinceSent: 0,
    });
    expect(
      oneRequestAt(new Date('2026-10-21T21:00:00.000Z'), newest?.id ?? ''),
    ).toMatchObject({
      sentOn: '2026-10-21',
      daysSinceSent: 1,
    });
  });

  it('turn the Offer a fulfilment makes expired one millisecond past 14 days after the sending', () => {
    const newest = theQueue().content.at(-1);
    const sent = Date.parse(newest?.sentAt ?? '');
    const id = newest?.id ?? '';

    expect(oneRequestAt(new Date(sent + 14 * aDay), id).offerWouldBeExpired).toBe(false);
    expect(oneRequestAt(new Date(sent + 14 * aDay + 1), id).offerWouldBeExpired).toBe(true);
  });
});

// Both lists and one request's screen at their worst, for `break-ui`:
// `pnpm dashboard:inspect --part-requests worstCase`, `one` or `none`
// answers them from these instead.
describe("the made-up shop's Part Requests at their worst", () => {
  const codePoints = (text: string | undefined) => [...(text ?? '')].length;

  function shopWith(partRequests: 'worstCase' | 'one' | 'none') {
    const worst = madeUpShop(now, catalogPartsOfTheShop(), { partRequests });
    const read = (path: string) => {
      const answer = answerFromTheMadeUpShop(worst, now, { method: 'GET', path });
      expect(answer?.status).toBe(200);
      return answer?.body;
    };
    return {
      queue: (page = 0, size = 20) =>
        read(`/v1/part-requests?page=${page}&size=${size}`) as OpenPartRequestsPageResponse,
      list: () =>
        read(
          `/v1/vendors/${vendorId}/part-requests?page=0&size=100`,
        ) as VendorsPartRequestsPageResponse,
    };
  }

  it('fill the queue to thousands, the oldest waiting hundreds of days first', () => {
    const { queue } = shopWith('worstCase');
    const first = queue();

    expect(first.totalElements).toBe(2486);
    expect(first.totalPages).toBe(125);
    expect(first.content.slice(0, 7).map((request) => request.daysSinceSent)).toEqual([
      412, 301, 250, 200, 180, 120, 60,
    ]);
    expect(queue(124).content.length).toBe(6);
    expect(queue(124).content.at(-1)?.daysSinceSent).toBe(0);
  });

  it("hold in the shop's own list the longest name and part number the API takes, a name with no space, names in Kurdish and Arabic script and one that starts with a digit", () => {
    const names = shopWith('worstCase')
      .list()
      .content.map((request) => request.name);
    const partNumbers = shopWith('worstCase')
      .list()
      .content.map((request) => request.partNumber);

    expect(Math.max(...names.map(codePoints))).toBe(300);
    expect(Math.max(...partNumbers.map(codePoints))).toBe(100);
    expect(names.some((name) => codePoints(name) > 60 && !name.includes(' '))).toBe(true);
    expect(names.some((name) => /^[؀-ۿ]/.test(name) && /[ێڵڕۆە]/.test(name))).toBe(true);
    expect(names.some((name) => /^[؀-ۿ]/.test(name) && /[ة]/.test(name))).toBe(true);
    expect(names.some((name) => /^[0-9]/.test(name))).toBe(true);
  });

  it('hold prices at their limits in both currencies, and a reason of 300 code points in Kurdish', () => {
    const { content } = shopWith('worstCase').list();
    const rejected = content.filter((request) => request.state === 'rejected');

    expect(content.map((request) => request.usdPrice)).toEqual(
      expect.arrayContaining(['100000.00', '0.01']),
    );
    expect(content.map((request) => request.iqdPrice)).toEqual(
      expect.arrayContaining([150000000, 1]),
    );
    expect(
      rejected.some(
        (request) =>
          codePoints(request.reason) === 300 && /[ێڵڕۆە]/.test(request.reason ?? ''),
      ),
    ).toBe(true);
  });

  it('name in the queue the longest Vendor name the API takes, and a deactivated one with no space', () => {
    const vendors = shopWith('worstCase')
      .queue()
      .content.map((request) => request.vendor);

    expect(vendors.some((vendor) => codePoints(vendor.name) === 100)).toBe(true);
    expect(vendors.some((vendor) => !vendor.active && !vendor.name.includes(' '))).toBe(
      true,
    );
  });

  it("answer one open request of the shop's in both lists, or none at all", () => {
    const one = shopWith('one');
    const none = shopWith('none');

    expect(one.queue()).toMatchObject({ totalElements: 1, content: [{ state: 'open' }] });
    expect(one.list()).toMatchObject({ totalElements: 1, content: [{ state: 'open' }] });
    expect(none.queue()).toMatchObject({ totalElements: 0, content: [] });
    expect(none.list()).toMatchObject({ totalElements: 0, content: [] });
  });
});

describe("the made-up shop's one Part Request", () => {
  it('is any of its requests, in any state, with its Vendor', () => {
    const [rejected] = theShopsList().content.filter(
      (request) => request.state === 'rejected',
    );

    expect(answerTo('GET', `/v1/part-requests/${rejected.id}`)).toEqual({
      status: 200,
      body: {
        ...rejected,
        vendor: { id: vendorId, name: 'Made-up PC Parts', active: true },
      },
    });
  });

  it.each([
    ['an identifier the shop holds none of', '11111111-1111-4111-8111-111111111111'],
    ['text that is not an identifier', 'not-an-identifier'],
  ])('is not found for %s, as the API answers it', (_, id) => {
    expect(answerTo('GET', `/v1/part-requests/${id}`)).toMatchObject({
      status: 404,
      body: { errors: [{ code: 'PART_REQUEST_NOT_FOUND' }] },
    });
  });

  it.each([
    ['POST', `/v1/vendors/${madeUpIdentifier(1)}/part-requests`],
    ['POST', `/v1/part-requests/${madeUpIdentifier(600001)}/fulfil`],
    ['POST', `/v1/part-requests/${madeUpIdentifier(600001)}/reject`],
  ])('is never sent, fulfilled or rejected: %s %s is refused', (method, path) => {
    expect(answerTo(method, path)).toMatchObject({
      status: 405,
      body: { errors: [{ code: 'MADE_UP_SHOP_IS_READ_ONLY' }] },
    });
  });
});

import { describe, expect, it } from '@jest/globals';
import type { BuildResponse } from '@pcp/api-client';

import {
  buildCookieOf,
  type MadeUpBuild,
  madeUpBuilds,
  partValuesOf,
} from '../made-up-builds.ts';
import { dual2060Super, ryzen7800X3D, theLongestName } from '../made-up-offers.ts';
import { answerFromTheStandIn } from '../stand-in-api.ts';
import { theShoppersShop } from '../the-shoppers-shop.ts';
import {
  now,
  photosStandIn,
  theShoppersCatalogStandIn,
} from './shoppers-catalog-stand-in.ts';

const shop = theShoppersShop(now, theShoppersCatalogStandIn(), photosStandIn);

// A made-up Build as the stand-in reads it, in a currency.
function read(build: MadeUpBuild, currency = 'IQD'): BuildResponse {
  const parts = partValuesOf(shop, build)
    .map((value) => `&part=${encodeURIComponent(value)}`)
    .join('');
  return answerFromTheStandIn(shop, {
    method: 'GET',
    path: `/v1/build?currency=${currency}${parts}`,
  }).body as BuildResponse;
}

describe('the made-up Builds', () => {
  it("are each read whole through the stand-in, but the one the API refuses, each Part one of the shop's real Parts, a kit or a drive with its quantity", () => {
    const { refused: _refused, ...readWhole } = madeUpBuilds;
    for (const build of Object.values(readWhole)) {
      const answer = read(build);

      expect(answer.parts.map((part) => part.name).sort()).toEqual(
        build.map(({ part }) => part.name).sort(),
      );
      for (const { part, quantity } of build) {
        expect(answer.parts.find((each) => each.name === part.name)?.quantity).toBe(
          quantity ?? null,
        );
      }
    }
  });

  it('give the API each Part by its identifier, and a kit or a drive with its quantity', () => {
    const values = partValuesOf(shop, madeUpBuilds.worstCase);

    expect(values.length).toBe(madeUpBuilds.worstCase.length);
    expect(values.filter((value) => /^[^:]+:\d+$/.test(value)).length).toBe(16);
    expect(() =>
      partValuesOf(shop, [{ part: { category: 'cpu', name: 'Not a Part of the shop' } }]),
    ).toThrow(
      'The made-up shop does not offer the cpu Part named "Not a Part of the shop".',
    );
  });

  // The Shopper app keeps a Build in its cookie `build`: each Part's
  // identifier under its Category, joined by a colon, and a kit's or a
  // drive's quantity after another, the entries joined by commas, in the
  // Build's order (builder ticket 07).
  it("give the Shopper app's Build cookie, each Part under its Category, a kit or a drive with its quantity", () => {
    const entries = buildCookieOf(shop, madeUpBuilds.complete).split(',');

    // The test's catalog names its Parts otherwise than the API does.
    expect(entries.map((entry) => entry.replace(/:[^:]+/, ':<id>'))).toEqual([
      'cpu:<id>',
      'cpuCooler:<id>',
      'motherboard:<id>',
      'ram:<id>:2',
      'storage:<id>:1',
      'gpu:<id>',
      'case:<id>',
      'psu:<id>',
    ]);
    expect(entries[0]).toBe(`cpu:${partValuesOf(shop, madeUpBuilds.complete)[0]}`);
    expect(buildCookieOf(shop, madeUpBuilds.empty)).toBe('');
    expect(buildCookieOf(shop, madeUpBuilds.worstCase).split(',').length).toBe(22);
  });

  // A cookie edited by hand, which no form of the Shopper app writes: a RAM
  // kit filed under the CPU, which the Shopper app reads as a CPU and sends
  // with no quantity, so that the API refuses the Build (the owner's answer
  // of 13 November 2026).
  it('are one the API refuses, a RAM kit filed under the CPU', () => {
    const [entry] = buildCookieOf(shop, madeUpBuilds.refused).split(',');
    const [kit] = partValuesOf(shop, madeUpBuilds.refused);

    expect(entry).toBe(`cpu:${kit}`);
    expect(
      answerFromTheStandIn(shop, {
        method: 'GET',
        path: `/v1/build?currency=IQD&part=${kit}`,
      }).status,
    ).toBe(400);
  });

  it('are an empty one, needing every Category', () => {
    const empty = read(madeUpBuilds.empty);

    expect(empty.parts).toEqual([]);
    expect(empty.stillNeeded.length).toBe(8);
  });

  it('are a Complete one, quoted partly in dollars, so that its total in dinars is converted', () => {
    const complete = read(madeUpBuilds.complete);

    expect(complete.complete).toBe(true);
    expect(complete.parts.some((part) => part.unstocked)).toBe(false);
    expect(complete.totalAcrossVendors?.converted).toBe(true);
  });

  it("are the worst case: 8 different RAM kits and 8 different drives, the catalog's longest Part name, the longest a Build can hold beside it, an Unstocked Part and the Part 20 Vendors offer", () => {
    const worst = read(madeUpBuilds.worstCase);
    const ofCategory = (category: string) =>
      new Set(
        worst.parts.filter((part) => part.category === category).map((part) => part.id),
      );
    const names = worst.parts.map((part) => part.name);
    const cpu = worst.parts.find((part) => part.category === 'cpu');

    expect(ofCategory('ram').size).toBe(8);
    expect(ofCategory('storage').size).toBe(8);
    expect(names).toContain(theLongestName.name);
    expect(names).toContain(dual2060Super.name);
    expect(worst.parts.some((part) => part.unstocked)).toBe(true);
    expect(cpu?.name).toBe(ryzen7800X3D.name);
    expect(
      new Set(
        shop.offers.filter((offer) => offer.partId === cpu?.id).map((o) => o.vendorId),
      ).size,
    ).toBe(20);
    expect(
      madeUpBuilds.worstCase.every(
        ({ quantity }) => quantity === undefined || (quantity >= 1 && quantity <= 16),
      ),
    ).toBe(true);
  });
});

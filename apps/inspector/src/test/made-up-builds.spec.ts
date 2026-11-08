import { describe, expect, it } from '@jest/globals';
import type { BuildResponse } from '@pcp/api-client';

import { type MadeUpBuild, madeUpBuilds, partValuesOf } from '../made-up-builds.ts';
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
  it("are each read whole through the stand-in, each Part one of the shop's real Parts, a kit or a drive with its quantity", () => {
    for (const build of Object.values(madeUpBuilds)) {
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

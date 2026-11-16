import { describe, expect, it } from '@jest/globals';
import type { SharedBuildResponse } from '@pcp/api-client';

import { buildCookieOf, madeUpBuilds } from '../made-up-builds.ts';
import {
  madeUpSharedBuildId,
  type MadeUpSharedBuildName,
} from '../made-up-shared-builds.ts';
import { answerFromTheStandIn } from '../stand-in-api.ts';
import { theShoppersShop } from '../the-shoppers-shop.ts';
import {
  now,
  photosStandIn,
  theShoppersCatalogStandIn,
} from './shoppers-catalog-stand-in.ts';

const shop = theShoppersShop(now, theShoppersCatalogStandIn(), photosStandIn);

// A made-up Shared Build as the stand-in answers it.
function read(name: MadeUpSharedBuildName): SharedBuildResponse {
  return answerFromTheStandIn(shop, {
    method: 'GET',
    path: `/v1/shared-builds/${madeUpSharedBuildId(name)}`,
  }).body as SharedBuildResponse;
}

// The Parts a Build cookie holds, each as the API's `part` value: the
// cookie's entries without the Category each is filed under.
function partValuesInTheCookie(cookie: string): string[] {
  return cookie.split(',').map((entry) => entry.slice(entry.indexOf(':') + 1));
}

describe('the made-up Shared Builds', () => {
  // `pnpm shopper:inspect --build complete` on the complete one's page shows
  // it in its "This is your Build" state, since the Shopper app compares
  // the Build its cookie holds with the Shared Build's Parts.
  it('hold the Parts the made-up Builds’ cookies hold, so that the browser holding one is told it is its own Build', () => {
    expect(read('complete').part).toEqual(
      partValuesInTheCookie(buildCookieOf(shop, madeUpBuilds.complete)),
    );
    expect(read('worstCase').part).toEqual(
      partValuesInTheCookie(buildCookieOf(shop, madeUpBuilds.worstCase)),
    );
    expect(read('worstCase').part).not.toEqual(read('complete').part);
  });

  it('are one whose Parts no catalog holds, none of them a Part of the shop', () => {
    const values = read('leftTheCatalog').part;

    expect(values.length).toBeGreaterThan(0);
    expect(values.some((value) => shop.parts.has(value.split(':')[0]))).toBe(false);
  });

  it('each have an identifier that says it is made up, which its page’s path ends with', () => {
    expect(madeUpSharedBuildId('complete')).toBe('00000000-0000-4000-8000-000000700001');
    expect(madeUpSharedBuildId('worstCase')).toBe('00000000-0000-4000-8000-000000700002');
    expect(madeUpSharedBuildId('leftTheCatalog')).toBe(
      '00000000-0000-4000-8000-000000700003',
    );
  });
});

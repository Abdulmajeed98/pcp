import {
  a650bn,
  a850gl,
  b650Tomahawk,
  barraCuda,
  type CatalogPart,
  dual2060Super,
  flareX5,
  furyBeast16,
  furyBeast32,
  gigastone,
  inlandPremium,
  ironWolf,
  mx500,
  nhD15,
  p3Plus,
  palit4070Super,
  ryzen7600X,
  ryzen7800X3D,
  samsung870Evo,
  samsung990Pro,
  sn850x,
  theLongestName,
  theOnlyCase,
  tridentZ5,
  vengeance,
  vengeanceLpx16,
  vengeanceLpx64,
} from './made-up-offers.ts';
import type { ShoppersShop } from './the-shoppers-shop.ts';

// The made-up Builds, which the Build page and the picker are designed and
// inspected with, through the stand-in API, without the development
// database. Each holds real Parts the made-up shop offers (`made-up-offers.ts`),
// each RAM kit and drive with how many of it the Build holds. What the
// stand-in answers for each, in each currency, is recorded in the builder
// module's ticket 05.

// A Part of a made-up Build, and for a RAM kit or a drive its quantity;
// and, for a cookie edited by hand, the Category it is filed under, when it
// is not its own.
export interface MadeUpBuildPart {
  part: CatalogPart;
  quantity?: number;
  filedUnder?: CatalogPart['category'];
}

export type MadeUpBuild = readonly MadeUpBuildPart[];

export const madeUpBuilds = {
  // A Build with no Part yet.
  empty: [],

  // A Complete Build that every Compatibility Rule passes, with a GPU
  // beside the CPU's integrated graphics. Its cooler, board and PSU are
  // quoted in dollars alone, so that its total in dinars is converted.
  complete: [
    { part: ryzen7600X },
    { part: nhD15 },
    { part: b650Tomahawk },
    { part: vengeance, quantity: 2 },
    { part: samsung990Pro, quantity: 1 },
    { part: palit4070Super },
    { part: theOnlyCase },
    { part: a850gl },
  ],

  // The worst case `break-ui` needs. The CPU is the Part 20 Vendors offer.
  // The cooler has the longest name the catalog holds, and no CPU socket, so
  // that rule 2 is unchecked; the next longest is a cooler too, which a Build
  // cannot hold beside it, so the GPU has the longest name a Build can hold
  // beside it, the third longest, and no Vendor has it in stock. 8 different
  // RAM kits and 8 different drives, a few of them Unstocked Parts, one of
  // each held 16 times, are more than the board and the case take, making
  // Compatibility Problems; the PSU has one CPU power connector for the
  // board's two, a Compatibility Warning.
  worstCase: [
    { part: ryzen7800X3D },
    { part: theLongestName },
    { part: b650Tomahawk },
    { part: vengeance, quantity: 2 },
    { part: tridentZ5, quantity: 1 },
    { part: furyBeast16, quantity: 1 },
    { part: furyBeast32, quantity: 1 },
    { part: gigastone, quantity: 1 },
    { part: vengeanceLpx16, quantity: 1 },
    { part: vengeanceLpx64, quantity: 1 },
    { part: flareX5, quantity: 16 },
    { part: sn850x, quantity: 1 },
    { part: samsung990Pro, quantity: 1 },
    { part: p3Plus, quantity: 1 },
    { part: inlandPremium, quantity: 16 },
    { part: samsung870Evo, quantity: 1 },
    { part: mx500, quantity: 2 },
    { part: barraCuda, quantity: 1 },
    { part: ironWolf, quantity: 4 },
    { part: dual2060Super },
    { part: theOnlyCase },
    { part: a650bn },
  ],

  // A cookie edited by hand, which no form of the Shopper app writes: a RAM
  // kit filed under the CPU, with no quantity. The Shopper app reads it as a
  // CPU, and the API, which knows the Part is a kit, refuses the Build, so
  // that the Build page says it cannot be read and offers to empty it (the
  // owner's answer of 13 November 2026).
  refused: [{ part: vengeance, filedUnder: 'cpu' }],
} satisfies Record<string, MadeUpBuild>;

export type MadeUpBuildName = keyof typeof madeUpBuilds;

// A made-up Build as the Shopper app keeps it in its cookie `build`, which
// `pnpm shopper:inspect --build` puts in every tab (builder ticket 07): one
// entry for each Part, in the Build's order, joined by commas, each the
// Category's key and the Part's `part` value joined by a colon,
// `cpu:<identifier>` and, for a RAM kit or a drive, `ram:<identifier>:2`;
// a Part filed by hand under another Category is written under it.
// The Shopper app reads it with `readTheBuild` (`entities/build`); the command
// runs in Node, which reads no app's code, so the text is written here.
export function buildCookieOf(shop: ShoppersShop, build: MadeUpBuild): string {
  const values = partValuesOf(shop, build);
  return build
    .map(({ part, filedUnder }, place) => `${filedUnder ?? part.category}:${values[place]}`)
    .join(',');
}

// A made-up Build as the API's `part` values give it, in its order: each
// Part's identifier in the shop, followed for a RAM kit or a drive by `:`
// and its quantity. A Part the shop does not offer stops the command.
export function partValuesOf(
  shop: Pick<ShoppersShop, 'parts'>,
  build: MadeUpBuild,
): string[] {
  return build.map(({ part, quantity }) => {
    const read = [...shop.parts.values()].find(
      ({ summary }) => summary.category === part.category && summary.name === part.name,
    );
    if (read === undefined) {
      throw new Error(
        `The made-up shop does not offer the ${part.category} Part named "${part.name}".`,
      );
    }
    return quantity === undefined ? read.summary.id : `${read.summary.id}:${quantity}`;
  });
}

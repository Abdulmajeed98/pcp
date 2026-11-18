import type { SharedBuildResponse } from '@pcp/api-client';

import { type MadeUpBuild, madeUpBuilds, partValuesOf } from './made-up-builds.ts';
import { madeUpIdentifier } from './made-up-vendors.ts';
import { calendarDaysBetween, theDayOf } from './the-platforms-day.ts';
import type { ShoppersShop } from './the-shoppers-shop.ts';

// The made-up Shared Builds, which the Shared Build page is designed and
// inspected with, through the stand-in API, without the development
// database: two made from the made-up Builds, `complete` and `worstCase`,
// and one whose Parts no catalog holds, as a Shared Build whose Parts have
// all left the catalog since it was shared. Each has an identifier that says
// it is made up, so that its page's path can be given to
// `pnpm shopper:inspect`, `/builds/00000000-0000-4000-8000-000000700001`.
//
// A Shared Build holds its Parts as the API freezes them, as `GET v1/build`
// takes them in `part`: each Part's identifier, a RAM kit's or a drive's
// followed by `:` and its quantity, in the catalog's order of Categories and
// then the Build's, as the made-up Builds are written. So the Build cookie
// `pnpm shopper:inspect --build complete` writes holds the same Parts as the
// `complete` Shared Build, and its page is in its "This is your Build" state.

// How long before the shop's now a Shared Build was shared.
interface SharedAgo {
  days: number;
  hours: number;
}

type MadeUpSharedBuild = {
  counter: number;
  sharedAgo: SharedAgo;
} & ({ build: MadeUpBuild } | { part: readonly string[] });

export const madeUpSharedBuilds = {
  // Shared today, three hours ago.
  complete: {
    counter: 700001,
    sharedAgo: { days: 0, hours: 3 },
    build: madeUpBuilds.complete,
  },

  // Shared 12 days ago: every kind of outcome, 8 kits and 8 drives, the
  // longest names, Unstocked Parts and the Part 20 Vendors offer.
  worstCase: {
    counter: 700002,
    sharedAgo: { days: 12, hours: 4 },
    build: madeUpBuilds.worstCase,
  },

  // Shared 400 days ago, of eight Parts no catalog holds: a CPU, a
  // motherboard, two RAM kits and a drive, a GPU, a case and a PSU.
  // `GET v1/build` leaves each out, as it leaves out a Part that has left
  // the catalog, so the Build it answers holds none.
  leftTheCatalog: {
    counter: 700003,
    sharedAgo: { days: 400, hours: 0 },
    part: [
      madeUpIdentifier(799001),
      madeUpIdentifier(799002),
      `${madeUpIdentifier(799003)}:2`,
      `${madeUpIdentifier(799004)}:2`,
      `${madeUpIdentifier(799005)}:1`,
      madeUpIdentifier(799006),
      madeUpIdentifier(799007),
      madeUpIdentifier(799008),
    ],
  },
} satisfies Record<string, MadeUpSharedBuild>;

export type MadeUpSharedBuildName = keyof typeof madeUpSharedBuilds;

// A made-up Shared Build's identifier, which its page's path ends with.
export function madeUpSharedBuildId(name: MadeUpSharedBuildName): string {
  return madeUpIdentifier(madeUpSharedBuilds[name].counter);
}

const anHour = 60 * 60 * 1000;
const aDay = 24 * anHour;

// The made-up Shared Builds at `now`, as `GET v1/shared-builds/{id}` answers
// each, by its identifier; a made-up Build's Parts are the shop's, by its
// identifiers in the catalog.
export function theMadeUpSharedBuilds(
  now: Date,
  shop: Pick<ShoppersShop, 'parts'>,
): ReadonlyMap<string, SharedBuildResponse> {
  return new Map(
    Object.values(madeUpSharedBuilds).map((shared: MadeUpSharedBuild) => {
      const id = madeUpIdentifier(shared.counter);
      const ago = shared.sharedAgo.days * aDay + shared.sharedAgo.hours * anHour;
      const sharedAt = new Date(now.getTime() - ago);
      return [
        id,
        {
          id,
          sharedAt: sharedAt.toISOString(),
          sharedOn: theDayOf(sharedAt),
          daysSinceShared: calendarDaysBetween(sharedAt, now),
          part: 'build' in shared ? partValuesOf(shop, shared.build) : [...shared.part],
        },
      ];
    }),
  );
}

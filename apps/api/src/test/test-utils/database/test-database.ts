import { join } from 'node:path';

import { connectionOf } from '@pcp/core';
import { emptyTables, TestDatabaseSettings } from '@pcp/core/test-utils';
import { Client } from 'pg';

// The migrations as they are committed, which every test database is built
// from.
export const migrationsFolder = join(__dirname, '..', '..', '..', 'drizzle');

// The database the global set-up started, as the API's settings name it.
export function testDatabaseSettings(): TestDatabaseSettings {
  const { DATASOURCE_URL, DATASOURCE_USERNAME, DATASOURCE_PASSWORD } = process.env;
  if (!DATASOURCE_URL || !DATASOURCE_USERNAME || !DATASOURCE_PASSWORD) {
    throw new Error(
      'There is no test database. Run this test with "pnpm integration:check".',
    );
  }

  return {
    url: DATASOURCE_URL,
    username: DATASOURCE_USERNAME,
    password: DATASOURCE_PASSWORD,
  };
}

// Points the API's settings at a database, for the API a test builds next.
export function useDatabase(settings: TestDatabaseSettings): void {
  process.env.DATASOURCE_URL = settings.url;
  process.env.DATASOURCE_USERNAME = settings.username;
  process.env.DATASOURCE_PASSWORD = settings.password;
}

// Empties every table, so that a test starts from an empty database.
export function emptyTheDatabase(): Promise<void> {
  return emptyTables(testDatabaseSettings());
}

// Runs SQL in the test database as the API's own database user.
async function inTheDatabase(statement: string): Promise<void> {
  const client = new Client(connectionOf(testDatabaseSettings()));
  await client.connect();
  try {
    await client.query(statement);
  } finally {
    await client.end();
  }
}

// A Part's specifications written as they are given, past the checks of its
// Category's list, as a Part kept before its list changed holds them: a 0
// kept before 0 meant "not known" for that specification, say. No endpoint
// can store such a Part, so this is the one way a test makes one.
export async function keepSpecificationsAsTheyAre(
  partId: string,
  specifications: Record<string, unknown>,
): Promise<void> {
  const client = new Client(connectionOf(testDatabaseSettings()));
  await client.connect();
  try {
    await client.query('UPDATE part SET specifications = $1 WHERE id = $2', [
      specifications,
      partId,
    ]);
  } finally {
    await client.end();
  }
}

// A Part taken out of the catalog, as no endpoint can: nothing in the
// platform deletes a Part, yet a Shared Build must outlive one that leaves,
// as an old Build does in a Shopper's cookie. The Part has no Offer and no
// photo, whose references would refuse it. It is the fourth named exception
// that arranges data through the database rather than the endpoints, after
// `changeTheRateAndDeactivateAVendorWhileReading` below.
export async function takeThePartOutOfTheCatalog(partId: string): Promise<void> {
  const client = new Client(connectionOf(testDatabaseSettings()));
  await client.connect();
  try {
    await client.query('DELETE FROM part WHERE id = $1', [partId]);
  } finally {
    await client.end();
  }
}

// A row of the Offer history, as the database holds it.
export type OfferHistoryRow = {
  changedAt: Date;
  vendorId: string;
  partId: string;
  change: string;
  usdPriceCents: number | null;
  iqdPrice: number | null;
  inStock: boolean;
  changedBy: string;
};

// Every row of the Offer history, oldest first. Nothing in the API answers
// the history, so this is the one thing a test reads from the database
// rather than through the API.
export async function offerHistoryRows(): Promise<OfferHistoryRow[]> {
  const client = new Client(connectionOf(testDatabaseSettings()));
  await client.connect();
  try {
    const { rows } = await client.query<OfferHistoryRow>(
      `SELECT changed_at AS "changedAt", vendor_id AS "vendorId", part_id AS "partId",
              change, usd_price_cents AS "usdPriceCents", iqd_price AS "iqdPrice",
              in_stock AS "inStock", changed_by AS "changedBy"
         FROM offer_history ORDER BY changed_at, id`,
    );
    return rows;
  } finally {
    await client.end();
  }
}

// A row of the Platform Rate's settings, as the database holds it.
export type PlatformRateRow = {
  iqdPerUsd: number;
  setAt: Date;
  setBy: string;
};

// Every setting of the Platform Rate, in the order they were added. The API
// answers only the current one, so this is how a test sees that every
// setting is kept.
export async function platformRateRows(): Promise<PlatformRateRow[]> {
  const client = new Client(connectionOf(testDatabaseSettings()));
  await client.connect();
  try {
    const { rows } = await client.query<PlatformRateRow>(
      `SELECT iqd_per_usd AS "iqdPerUsd", set_at AS "setAt", set_by AS "setBy"
         FROM platform_rate ORDER BY id`,
    );
    return rows;
  } finally {
    await client.end();
  }
}

// A change to the Platform Rate and to every Offer's USD Quoted Price, made
// in one transaction, which holds one of their tables locked from its start
// until a read has had to wait for it, and only then commits: a read that
// takes the rate and the Offers in two queries takes one of them before the
// change and the other after, where a read in one query takes both after.
//
// It is a named exception to testing the platform from outside, as
// `offerHistoryRows` and `keepSpecificationsAsTheyAre` are: the second, after
// `keepSpecificationsAsTheyAre`, that arranges data through the database
// rather than the endpoints. No endpoint can arrange it: each request is its own
// transaction, so none changes the rate and the Offers at once, and none
// holds a table locked while another request reads. The rate is set at
// `setAt`, the time by the API's clock, which a test may have moved, and
// never by the database's own clock: the API sets every rate by its clock
// (`platform-rate.schema.ts`), and a rate set by another clock could fall
// before the current one and never become current.
export function changeTheRateAndTheOffersWhileReading<T>(
  change: {
    iqdPerUsd: number;
    setAt: Date;
    usdPriceCents: number;
    lockedTable: 'offer' | 'platform_rate';
  },
  read: () => Promise<T>,
): Promise<T> {
  return changeWhileReading(
    lockingTheTable(change.lockedTable),
    async (changing) => {
      await addARate(changing, change.iqdPerUsd, change.setAt);
      await changing.query('UPDATE offer SET usd_price_cents = $1', [change.usdPriceCents]);
    },
    read,
  );
}

// A change to the Platform Rate and to one Vendor, made in one transaction
// while a read waits, as `changeTheRateAndTheOffersWhileReading` makes its
// own: a new rate, and the Vendor deactivated, so that the Vendor and its
// Offers leave the platform's figures. A read that takes the rate and the
// counts in two queries, or the Vendors and the Offers, takes one of them
// before the change and the other after, while a table the first of its
// queries does not read is the one locked; a read in one query takes all of
// them after.
//
// It is the third named exception, after `changeTheRateAndTheOffersWhileReading`,
// for the same reason: no endpoint changes the rate and a Vendor at once, or
// holds a table locked while another request reads. The Vendor is
// deactivated in the database alone, and its Login stays as it was, which no
// figure reads. The rate is set at `setAt`, by the API's clock, as there.
export function changeTheRateAndDeactivateAVendorWhileReading<T>(
  change: {
    iqdPerUsd: number;
    setAt: Date;
    vendorId: string;
    lockedTable: 'vendor' | 'offer' | 'platform_rate';
  },
  read: () => Promise<T>,
): Promise<T> {
  return changeWhileReading(
    lockingTheTable(change.lockedTable),
    async (changing) => {
      await addARate(changing, change.iqdPerUsd, change.setAt);
      await changing.query('UPDATE vendor SET active = false WHERE id = $1', [
        change.vendorId,
      ]);
    },
    read,
  );
}

// A setting of the Platform Rate, as a row the change adds.
async function addARate(changing: Client, iqdPerUsd: number, setAt: Date): Promise<void> {
  await changing.query(
    `INSERT INTO platform_rate (iqd_per_usd, set_at, set_by) VALUES ($1, $2, 'test')`,
    [iqdPerUsd, setAt],
  );
}

// What a change's transaction holds from its start: one table, locked.
function lockingTheTable(lockedTable: string): (changing: Client) => Promise<unknown> {
  return (changing) => changing.query(`LOCK TABLE ${lockedTable} IN ACCESS EXCLUSIVE MODE`);
}

// A change made in one transaction, which holds what it is told to hold, one
// table or one row, from its start until as many requests as given, one read
// unless told, have had to wait for it, and only then commits; and what the
// requests answered.
async function changeWhileReading<T>(
  hold: (changing: Client) => Promise<unknown>,
  change: (changing: Client) => Promise<void>,
  read: () => Promise<T>,
  waiting = 1,
): Promise<T> {
  const changing = new Client(connectionOf(testDatabaseSettings()));
  const watching = new Client(connectionOf(testDatabaseSettings()));
  await changing.connect();
  await watching.connect();
  try {
    await changing.query('BEGIN');
    await hold(changing);
    await change(changing);

    const reading = read();
    // Until as many requests as given wait for the lock.
    for (let tries = 0; ; tries += 1) {
      const { rows } = await watching.query<{ waiting: number }>(
        'SELECT count(*)::int AS waiting FROM pg_locks WHERE NOT granted',
      );
      if (rows[0].waiting >= waiting) break;
      if (tries > 500) {
        throw new Error(
          `Fewer than ${String(waiting)} requests waited for the locked table.`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    await changing.query('COMMIT');

    return await reading;
  } finally {
    await changing.end();
    await watching.end();
  }
}

// Requests that meet a table at one moment, as requests sent at once can:
// the table is held locked while they are sent, each waits for it, and it is
// let go once as many as given are waiting, so that none of them reads or
// writes it before the others have reached it. Requests sent at once without
// it can reach the table one after another, each done before the next comes,
// and then a read before an insert hides a missing unique rule (`offers`
// ticket 01).
//
// It is the fifth named exception that arranges data through the database,
// after `takeThePartOutOfTheCatalog`, for the same reason as
// `changeTheRateAndTheOffersWhileReading`: no endpoint holds a table locked.
// The two lock-and-wait helpers share `changeWhileReading`, this one making
// no change while it holds the table.
export function sentWhileTheTableIsHeld<T>(
  lockedTable: 'shared_build',
  waiting: number,
  send: () => Promise<T>,
): Promise<T> {
  return changeWhileReading(lockingTheTable(lockedTable), async () => {}, send, waiting);
}

// Calls about one Part Request that meet its row at one moment, as calls
// sent at once can: the row is held, as a resolution holds it, while they
// are sent, and let go once as many as given wait for it. Each resolution
// then has read the request before any other has changed it, unless it
// waits for the row itself, which is what makes a request resolved once
// (`part-requests` ticket 01). Only the row is held, so a read that does
// not ask to hold it goes on, as it would beside a resolution.
//
// It is the sixth named exception that arranges data through the database,
// after `sentWhileTheTableIsHeld`, for the same reason: no endpoint holds a
// row.
export function sentWhileThePartRequestIsHeld<T>(
  partRequestId: string,
  waiting: number,
  send: () => Promise<T>,
): Promise<T> {
  return changeWhileReading(
    (changing) =>
      changing.query('SELECT id FROM part_request WHERE id = $1 FOR UPDATE', [
        partRequestId,
      ]),
    async () => {},
    send,
    waiting,
  );
}

// A call sent while the Vendor adds its own Offer for a Part, as a
// fulfilment and the Vendor's own add can arrive at one moment: the Offer is
// added in a transaction that stays open while the call is sent, and commits
// only once the call waits for it. The call has then read the Vendor's
// Offers before the Offer was there, and meets it only when it writes an
// Offer for the same Part, which waits for the Vendor's. The Offer and the
// first row of its history are written as the Vendor's own add writes them:
// in US dollars alone, confirmed and made at `addedAt`, by the Vendor's
// Login.
//
// It is the seventh named exception that arranges data through the
// database, after `sentWhileThePartRequestIsHeld`, for the same reason: no
// endpoint holds its transaction open while another call is sent. It holds
// the Offer's row through `changeWhileReading`, as those hold a table or a
// row.
export function sentWhileTheVendorAddsAnOffer<T>(
  added: {
    vendorId: string;
    partId: string;
    usdPriceCents: number;
    inStock: boolean;
    addedAt: Date;
    addedBy: string;
  },
  send: () => Promise<T>,
): Promise<T> {
  return changeWhileReading(
    theVendorsOwnAdd({ ...added, iqdPrice: null, warrantyMonths: null }),
    async () => {},
    send,
  );
}

// An Offer the Vendor adds for itself, as its own add writes it: confirmed
// and made at `addedAt`, with the first row of its history by the Vendor's
// Login, in the transaction it is handed, which holds the Offer's row until
// it ends.
function theVendorsOwnAdd(added: {
  vendorId: string;
  partId: string;
  usdPriceCents: number | null;
  iqdPrice: number | null;
  inStock: boolean;
  warrantyMonths: number | null;
  addedAt: Date;
  addedBy: string;
}): (changing: Client) => Promise<void> {
  const { vendorId, partId, usdPriceCents, iqdPrice, inStock, warrantyMonths } = added;
  return async (changing) => {
    await changing.query(
      `INSERT INTO offer (vendor_id, part_id, usd_price_cents, iqd_price, in_stock, warranty_months, confirmed_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
      [vendorId, partId, usdPriceCents, iqdPrice, inStock, warrantyMonths, added.addedAt],
    );
    await changing.query(
      `INSERT INTO offer_history (vendor_id, part_id, usd_price_cents, iqd_price, in_stock, changed_at, change, changed_by)
         VALUES ($1, $2, $3, $4, $5, $6, 'created', $7)`,
      [vendorId, partId, usdPriceCents, iqdPrice, inStock, added.addedAt, added.addedBy],
    );
  };
}

// A fault planted in the database for as long as the function runs: a rule
// that the Vendor's Offer for one Part breaks, checked whenever that Offer
// is written and not against Offers stored already, so that the database
// refuses one row's write of an Offer sheet's upload, which then has to
// leave every other Offer as it was.
//
// It is the eighth named exception, after `sentWhileTheVendorAddsAnOffer`:
// no endpoint can make the database refuse one write among many it accepts,
// as `whileTheDatabaseRefusesEveryVendor` makes it refuse every Vendor.
export async function whileTheDatabaseRefusesTheOfferOf(
  vendorId: string,
  partId: string,
  run: () => Promise<void>,
): Promise<void> {
  // A rule takes no parameters, so the identifiers are checked to be
  // identifiers before they are written into it.
  for (const identifier of [vendorId, partId]) {
    if (!/^[0-9a-f-]{36}$/.test(identifier)) {
      throw new Error(`Not an identifier: ${identifier}`);
    }
  }
  await inTheDatabase(
    `ALTER TABLE offer ADD CONSTRAINT planted_refusal_of_one_offer
       CHECK (NOT (vendor_id = '${vendorId}' AND part_id = '${partId}')) NOT VALID`,
  );
  try {
    await run();
  } finally {
    await inTheDatabase('ALTER TABLE offer DROP CONSTRAINT planted_refusal_of_one_offer');
  }
}

// An Offer sheet's upload sent while the Vendor adds its own Offer for one
// of the file's Parts, as the upload and the Vendor's own add in the portal
// can arrive at one moment: the Offer is added, with every detail an Offer
// holds, in a transaction that stays open while the upload is sent, and
// commits only once the upload waits for it. The upload has then read the
// Vendor's Offers before the Offer was there, and meets it only when it
// writes an Offer for the same Part, which waits for the Vendor's.
//
// It is the ninth named exception that arranges data through the database,
// after `whileTheDatabaseRefusesTheOfferOf`, for the same reason as
// `sentWhileTheVendorAddsAnOffer`, the seventh, which it is built as, on
// `changeWhileReading`, and whose add it writes: no endpoint holds its
// transaction open while another call is sent.
export function uploadedWhileTheVendorAddsAnOffer<T>(
  added: {
    vendorId: string;
    partId: string;
    usdPriceCents: number | null;
    iqdPrice: number | null;
    inStock: boolean;
    warrantyMonths: number | null;
    addedAt: Date;
    addedBy: string;
  },
  upload: () => Promise<T>,
): Promise<T> {
  return changeWhileReading(theVendorsOwnAdd(added), async () => {}, upload);
}

// A fault planted in the database for as long as the function runs: a rule
// that no Vendor meets, checked when a Vendor is stored and not against
// those stored already, so that creating or editing one is refused.
export async function whileTheDatabaseRefusesEveryVendor(
  run: () => Promise<void>,
): Promise<void> {
  await inTheDatabase(
    'ALTER TABLE vendor ADD CONSTRAINT planted_refusal_of_every_vendor CHECK (false) NOT VALID',
  );
  try {
    await run();
  } finally {
    await inTheDatabase(
      'ALTER TABLE vendor DROP CONSTRAINT planted_refusal_of_every_vendor',
    );
  }
}

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
    change.lockedTable,
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
    change.lockedTable,
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

// A change made in one transaction, which holds one table locked from its
// start until a read has had to wait for it, and only then commits; and what
// the read answered.
async function changeWhileReading<T>(
  lockedTable: string,
  change: (changing: Client) => Promise<void>,
  read: () => Promise<T>,
): Promise<T> {
  const changing = new Client(connectionOf(testDatabaseSettings()));
  const watching = new Client(connectionOf(testDatabaseSettings()));
  await changing.connect();
  await watching.connect();
  try {
    await changing.query('BEGIN');
    await changing.query(`LOCK TABLE ${lockedTable} IN ACCESS EXCLUSIVE MODE`);
    await change(changing);

    const reading = read();
    // Until the read waits for the lock.
    for (let tries = 0; ; tries += 1) {
      const { rows } = await watching.query<{ waiting: number }>(
        'SELECT count(*)::int AS waiting FROM pg_locks WHERE NOT granted',
      );
      if (rows[0].waiting > 0) break;
      if (tries > 200) throw new Error('No read waited for the locked table.');
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    await changing.query('COMMIT');

    return await reading;
  } finally {
    await changing.end();
    await watching.end();
  }
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

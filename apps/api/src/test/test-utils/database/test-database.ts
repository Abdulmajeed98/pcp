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
// No endpoint changes both at once, so this is the one way a test sees
// whether an answer mixes a rate with Offers of another moment.
export async function changeTheRateAndTheOffersWhileReading<T>(
  change: {
    iqdPerUsd: number;
    usdPriceCents: number;
    lockedTable: 'offer' | 'platform_rate';
  },
  read: () => Promise<T>,
): Promise<T> {
  const changing = new Client(connectionOf(testDatabaseSettings()));
  const watching = new Client(connectionOf(testDatabaseSettings()));
  await changing.connect();
  await watching.connect();
  try {
    await changing.query('BEGIN');
    await changing.query(`LOCK TABLE ${change.lockedTable} IN ACCESS EXCLUSIVE MODE`);
    await changing.query(
      `INSERT INTO platform_rate (iqd_per_usd, set_at, set_by) VALUES ($1, now(), 'test')`,
      [change.iqdPerUsd],
    );
    await changing.query('UPDATE offer SET usd_price_cents = $1', [change.usdPriceCents]);

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

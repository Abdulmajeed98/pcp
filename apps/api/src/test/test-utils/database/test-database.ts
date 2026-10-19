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

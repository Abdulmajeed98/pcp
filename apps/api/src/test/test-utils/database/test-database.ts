import { join } from 'node:path';

import { emptyTables, TestDatabaseSettings } from '@pcp/core/test-utils';

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

import { join } from 'node:path';

import { startTestDatabase } from '@pcp/core/test-utils';

// The migrations as they are committed, which the test database is built from.
const migrationsFolder = join(__dirname, '..', '..', '..', 'drizzle');

// Starts the database every test file of the run uses, and points the API's
// settings at it. Each test builds the API after this, so the API it builds
// reaches this database and no other.
export default async function globalSetup(): Promise<void> {
  const settings = await startTestDatabase(migrationsFolder);

  process.env.DATASOURCE_URL = settings.url;
  process.env.DATASOURCE_USERNAME = settings.username;
  process.env.DATASOURCE_PASSWORD = settings.password;
}

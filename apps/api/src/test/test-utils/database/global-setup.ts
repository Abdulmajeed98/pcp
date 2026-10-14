import { startTestDatabase } from '@pcp/core/test-utils';

import { migrationsFolder, useDatabase } from './test-database';

// Starts the database every test file of the run uses, and points the API's
// settings at it. Each test builds the API after this, so the API it builds
// reaches this database and no other.
export default async function globalSetup(): Promise<void> {
  useDatabase(await startTestDatabase(migrationsFolder));
}

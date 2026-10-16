import { startTestDatabase } from '@pcp/core/test-utils';

import { startTestKeycloak, useKeycloak } from './keycloak/test-keycloak';
import { migrationsFolder, useDatabase } from './database/test-database';

// Starts the database and the Keycloak every test file of the run uses, side
// by side, and points the API's settings at both. Each test builds the API
// after this, so the API it builds reaches these and no others.
export default async function globalSetup(): Promise<void> {
  const [database, keycloak] = await Promise.all([
    startTestDatabase(migrationsFolder),
    startTestKeycloak(),
  ]);
  useDatabase(database);
  useKeycloak(keycloak);
}

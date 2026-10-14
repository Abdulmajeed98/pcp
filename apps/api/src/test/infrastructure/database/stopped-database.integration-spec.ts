import {
  bearerHeader,
  expectErrorResponse,
  startSeparateTestDatabase,
  StartedTestDatabase,
} from '@pcp/core/test-utils';

import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../test-utils/create-test-app';
import {
  migrationsFolder,
  testDatabaseSettings,
  useDatabase,
} from '../../test-utils/database/test-database';

// This file stops its database, so it starts one of its own and leaves the
// one the other files share alone.
describe('the API when its database stops while it runs', () => {
  let database: StartedTestDatabase;
  let testApp: TestAppWithLogins;
  let adminToken: string;
  const sharedDatabase = testDatabaseSettings();

  beforeAll(async () => {
    database = await startSeparateTestDatabase(migrationsFolder);
    useDatabase(database.settings);
    testApp = await createTestAppWithLogins();
    adminToken = await testApp.tokenOf({ roles: ['admin'] });
  });

  afterAll(async () => {
    await testApp.close();
    await database.stop();
    useDatabase(sharedDatabase);
  });

  it('keeps running, answers a call that needs the database with 503, and answers one that needs none', async () => {
    // A Part is stored, so the API holds a connection to the database.
    const created = await fetch(`${testApp.baseUrl}/v1/parts`, {
      method: 'POST',
      headers: { ...bearerHeader(adminToken), 'content-type': 'application/json' },
      body: JSON.stringify({ category: 'cpu', name: 'Made-up CPU', manufacturer: 'AMD' }),
    });
    expect(created.status).toBe(201);
    const { id } = (await created.json()) as { id: string };

    // Stopping it ends that connection while it waits, unused, in the pool.
    await database.stop();

    const read = await fetch(`${testApp.baseUrl}/v1/parts/${id}`, {
      headers: bearerHeader(adminToken),
    });
    await expectErrorResponse(read, 503, [
      {
        code: 'DATABASE_UNAVAILABLE',
        title: 'database_unavailable_title',
        detail: 'database_unavailable_details',
      },
    ]);
    const status = await fetch(`${testApp.baseUrl}/v1/status`);
    expect(status.status).toBe(200);
  });
});

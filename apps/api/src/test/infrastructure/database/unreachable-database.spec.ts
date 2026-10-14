import { createServer } from 'node:net';

import { bearerHeader, expectErrorResponse } from '@pcp/core/test-utils';

import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../test-utils/create-test-app';

// A port on this machine where nothing listens, so that a connection to it is
// refused at once, as one to a stopped database is.
function aPortWhereNothingListens(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() =>
        typeof address === 'object' && address !== null
          ? resolve(address.port)
          : reject(new Error('No port was given')),
      );
    });
  });
}

const databaseUnavailable = [
  {
    code: 'DATABASE_UNAVAILABLE',
    title: 'database_unavailable_title',
    detail: 'database_unavailable_details',
  },
];

describe('the API while its database cannot be reached', () => {
  let testApp: TestAppWithLogins;
  let adminToken: string;

  beforeAll(async () => {
    process.env.DATASOURCE_URL = `postgresql://127.0.0.1:${await aPortWhereNothingListens()}/pcp`;
    testApp = await createTestAppWithLogins();
    adminToken = await testApp.tokenOf({ roles: ['admin'] });
  });

  afterAll(async () => {
    await testApp.close();
    delete process.env.DATASOURCE_URL;
  });

  it('still starts, and answers a call that needs no database', async () => {
    const response = await fetch(`${testApp.baseUrl}/v1/status`);

    expect(response.status).toBe(200);
  });

  it('answers a call that reads a Part with 503 and an error of its own', async () => {
    const response = await fetch(
      `${testApp.baseUrl}/v1/parts/6f1d2c3b-4a5e-4f60-8b7a-9c0d1e2f3a4b`,
      { headers: bearerHeader(adminToken) },
    );

    await expectErrorResponse(response, 503, databaseUnavailable);
  });

  it('answers a call that creates a Part in the same way', async () => {
    const response = await fetch(`${testApp.baseUrl}/v1/parts`, {
      method: 'POST',
      headers: { ...bearerHeader(adminToken), 'content-type': 'application/json' },
      body: JSON.stringify({ category: 'cpu', name: 'Made-up CPU', manufacturer: 'AMD' }),
    });

    await expectErrorResponse(response, 503, databaseUnavailable);
  });
});

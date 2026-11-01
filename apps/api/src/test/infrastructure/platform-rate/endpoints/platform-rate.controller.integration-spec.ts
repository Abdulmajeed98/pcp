import { randomUUID } from 'node:crypto';

import {
  accessDenied,
  bearerHeader,
  expectErrorResponse,
  unauthorized,
} from '@pcp/core/test-utils';

import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';
import { emptyTheDatabase } from '../../../test-utils/database/test-database';

// The Admin sets the Platform Rate, a whole number of IQD per USD, and reads
// the current one back with when it was set (PRC-1, ADR-0002).

// The Platform Rate as the API answers it.
type PlatformRateBody = {
  current: { iqdPerUsd: number; setAt: string } | null;
};

// The identifier of the Admin's own Login, which every setting records.
const adminLoginId = randomUUID();

describe('the Platform Rate', () => {
  let testApp: TestAppWithLogins;

  beforeAll(async () => {
    testApp = await createTestAppWithLogins();
  });

  afterAll(async () => {
    await testApp.close();
  });

  afterEach(async () => {
    await emptyTheDatabase();
  });

  // A token of the Admin's Login. Made when it is needed, so that it is
  // judged by the clock that is current then.
  function adminToken(): Promise<string> {
    return testApp.tokenOf({ subject: adminLoginId, roles: ['admin'] });
  }

  async function readRate(token: string | null): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/platform-rate`, {
      headers: token === null ? {} : bearerHeader(token),
    });
  }

  describe('read', () => {
    it('answers that there is none until the Admin sets one', async () => {
      const response = await readRate(await adminToken());

      expect(response.status).toBe(200);
      expect((await response.json()) as PlatformRateBody).toEqual({ current: null });
    });
  });

  describe('who may call it', () => {
    function vendorToken(): Promise<string> {
      return testApp.tokenOf({ subject: randomUUID(), roles: ['vendor'] });
    }

    it("refuses a Vendor's token with 403", async () => {
      await expectErrorResponse(await readRate(await vendorToken()), 403, accessDenied);
    });

    it('refuses a call without a token with 401', async () => {
      await expectErrorResponse(await readRate(null), 401, unauthorized);
    });
  });
});

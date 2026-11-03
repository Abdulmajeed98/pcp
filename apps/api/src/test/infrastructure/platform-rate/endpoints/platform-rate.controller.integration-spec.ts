import { randomUUID } from 'node:crypto';

import {
  accessDenied,
  bearerHeader,
  expectErrorResponse,
  notValid,
  unauthorized,
} from '@pcp/core/test-utils';

import { letTheClockRun, moveTheClockTo } from '../../../test-utils/clock';
import {
  createTestAppWithLogins,
  TestAppWithLogins,
} from '../../../test-utils/create-test-app';
import {
  emptyTheDatabase,
  platformRateRows,
} from '../../../test-utils/database/test-database';

// The Admin sets the Platform Rate, a whole number of IQD per USD, and reads
// the current one back with when it was set (PRC-1, ADR-0002).

// The Platform Rate as the API answers it.
type PlatformRateBody = {
  current: { iqdPerUsd: number; setAt: string } | null;
};

// The identifier of the Admin's own Login, which every setting records.
const adminLoginId = randomUUID();

// A moment for the API's clock, with milliseconds, so that a time stored
// with less precision would show.
const aMovedMoment = new Date('2027-03-14T09:26:53.589Z');

// A moment some time after another.
const aDay = 24 * 60 * 60 * 1000;
function after(moment: Date, milliseconds: number): Date {
  return new Date(moment.getTime() + milliseconds);
}

describe('the Platform Rate', () => {
  let testApp: TestAppWithLogins;

  beforeAll(async () => {
    testApp = await createTestAppWithLogins();
  });

  afterAll(async () => {
    await testApp.close();
  });

  afterEach(async () => {
    letTheClockRun();
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

  function setRate(body: unknown, token: string | null): Promise<Response> {
    return fetch(`${testApp.baseUrl}/v1/platform-rate`, {
      method: 'PUT',
      headers: {
        ...(token === null ? {} : bearerHeader(token)),
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  describe('read', () => {
    it('answers that there is none until the Admin sets one', async () => {
      const response = await readRate(await adminToken());

      expect(response.status).toBe(200);
      expect((await response.json()) as PlatformRateBody).toEqual({ current: null });
    });
  });

  describe('set', () => {
    it("is read back as the current rate, with the time of the API's clock", async () => {
      moveTheClockTo(aMovedMoment);
      const token = await adminToken();

      const set = await setRate({ iqdPerUsd: 1575 }, token);
      expect(set.status).toBe(200);
      const expected: PlatformRateBody = {
        current: { iqdPerUsd: 1575, setAt: aMovedMoment.toISOString() },
      };
      expect((await set.json()) as PlatformRateBody).toEqual(expected);

      const read = await readRate(token);
      expect((await read.json()) as PlatformRateBody).toEqual(expected);
    });

    // The Admin's own token, made after the clock has moved, and the current
    // rate read back with it.
    async function setAt(moment: Date, iqdPerUsd: number): Promise<void> {
      moveTheClockTo(moment);
      const response = await setRate({ iqdPerUsd }, await adminToken());
      expect(response.status).toBe(200);
    }
    async function currentRate(): Promise<PlatformRateBody> {
      return (await (await readRate(await adminToken())).json()) as PlatformRateBody;
    }

    it('makes a new rate the current one', async () => {
      await setAt(aMovedMoment, 1575);
      const later = after(aMovedMoment, aDay);
      await setAt(later, 1600);

      expect(await currentRate()).toEqual({
        current: { iqdPerUsd: 1600, setAt: later.toISOString() },
      });
    });

    it('sets a rate equal to the current one again, which moves its time', async () => {
      await setAt(aMovedMoment, 1600);
      const later = after(aMovedMoment, aDay);
      await setAt(later, 1600);

      expect(await currentRate()).toEqual({
        current: { iqdPerUsd: 1600, setAt: later.toISOString() },
      });
    });

    it("keeps every setting, with its rate, its time and the Admin's Login", async () => {
      const later = after(aMovedMoment, aDay);
      const latest = after(later, aDay);
      await setAt(aMovedMoment, 1575);
      await setAt(later, 1600);
      await setAt(latest, 1600);

      expect(await platformRateRows()).toEqual([
        { iqdPerUsd: 1575, setAt: aMovedMoment, setBy: adminLoginId },
        { iqdPerUsd: 1600, setAt: later, setBy: adminLoginId },
        { iqdPerUsd: 1600, setAt: latest, setBy: adminLoginId },
      ]);
    });
  });

  describe('refusals', () => {
    it.each([
      ['below the lowest', { iqdPerUsd: 499 }, 'outOfRange'],
      ['above the highest', { iqdPerUsd: 5001 }, 'outOfRange'],
      ['not a whole number', { iqdPerUsd: 1575.5 }, 'notWhole'],
      ['sent as a text', { iqdPerUsd: '1575' }, 'notANumber'],
      ['left out', {}, 'missing'],
      ['sent as null', { iqdPerUsd: null }, 'missing'],
    ])('refuses a rate %s, naming the field and why', async (_case, body, reason) => {
      const token = await adminToken();

      await expectErrorResponse(await setRate(body, token), 400, [
        notValid('iqdPerUsd', { reason }),
      ]);
      expect(await platformRateRows()).toEqual([]);
    });

    it.each([500, 5000])('accepts %d, at the edge of the range', async (iqdPerUsd) => {
      const response = await setRate({ iqdPerUsd }, await adminToken());

      expect(response.status).toBe(200);
      expect(((await response.json()) as PlatformRateBody).current?.iqdPerUsd).toBe(
        iqdPerUsd,
      );
    });
  });

  describe('who may call it', () => {
    function vendorToken(): Promise<string> {
      return testApp.tokenOf({ subject: randomUUID(), roles: ['vendor'] });
    }

    it("refuses a Vendor's token with 403 at both endpoints", async () => {
      const token = await vendorToken();

      await expectErrorResponse(await readRate(token), 403, accessDenied);
      await expectErrorResponse(
        await setRate({ iqdPerUsd: 1575 }, token),
        403,
        accessDenied,
      );
      expect(await platformRateRows()).toEqual([]);
    });

    it('refuses a call without a token with 401 at both endpoints', async () => {
      await expectErrorResponse(await readRate(null), 401, unauthorized);
      await expectErrorResponse(
        await setRate({ iqdPerUsd: 1575 }, null),
        401,
        unauthorized,
      );
      expect(await platformRateRows()).toEqual([]);
    });
  });
});

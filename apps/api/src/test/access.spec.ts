import { Controller, Get } from '@nestjs/common';
import { PreAuthorize, Role } from '@pcp/core';
import {
  bearerHeader,
  createTestKey,
  expectErrorResponse,
  signToken,
  signTokenWithoutKeyName,
  tokenSignedWithThePublicKeyAsSecret,
  unsignedToken,
  withChangedClaims,
} from '@pcp/core/test-utils';

import { createTestAppWithLogins, TestAppWithLogins } from './test-utils/create-test-app';

// Endpoints of kinds the real API does not have yet.
@Controller()
class ProbeController {
  @PreAuthorize([Role.ADMIN])
  @Get('test/admin-only')
  adminOnly(): { reached: boolean } {
    return { reached: true };
  }

  @Get('test/no-access-rule')
  noAccessRule(): { reached: boolean } {
    return { reached: true };
  }
}

const unauthorized = [
  { code: 'UNAUTHORIZED', title: 'unauthorized_title', detail: 'unauthorized_details' },
];
const accessDenied = [
  { code: 'ACCESS_DENIED', title: 'access_denied_title', detail: 'access_denied_details' },
];

describe('who may call the API', () => {
  let testApp: TestAppWithLogins;

  // The API asks the realm for its keys again no sooner than thirty seconds
  // after its last fetch. A test that needs it to ask lets that time pass.
  // Time only moves forward, for every test that follows, as it does for the
  // API. Only the clock the API reads between fetches is moved: a token's
  // expiry is still judged by the real time.
  const realTime = Date.now.bind(Date);
  let timePassed = 0;
  const clock = jest.spyOn(Date, 'now').mockImplementation(() => realTime() + timePassed);

  function letHalfAMinutePass(): void {
    timePassed += 31 * 1000;
  }

  beforeAll(async () => {
    testApp = await createTestAppWithLogins({ controllers: [ProbeController] });
  });

  afterAll(async () => {
    clock.mockRestore();
    await testApp.close();
  });

  function ask(path: string, headers: Record<string, string> = {}): Promise<Response> {
    return fetch(`${testApp.baseUrl}${path}`, { headers });
  }

  describe('a request that does not prove a login is answered 401', () => {
    it('when it carries no token', async () => {
      await expectErrorResponse(await ask('/v1/caller'), 401, unauthorized);
    });

    it('when its header is not a bearer token', async () => {
      const response = await ask('/v1/caller', { authorization: 'Basic YWRtaW46YWRtaW4=' });

      await expectErrorResponse(response, 401, unauthorized);
    });

    it('when its token is not a token', async () => {
      await expectErrorResponse(
        await ask('/v1/caller', bearerHeader('nonsense')),
        401,
        unauthorized,
      );
    });

    it('when its token was signed with another key under the same key name', async () => {
      const impostor = { ...(await createTestKey()), kid: testApp.key.kid };
      const token = await signToken(impostor, {
        issuer: testApp.keycloak.issuer,
        roles: ['admin'],
      });

      await expectErrorResponse(
        await ask('/v1/caller', bearerHeader(token)),
        401,
        unauthorized,
      );
    });

    it('when the claims of its token were changed after signing', async () => {
      const token = withChangedClaims(await testApp.tokenOf({ roles: ['vendor'] }), {
        realm_access: { roles: ['admin'] },
      });

      await expectErrorResponse(
        await ask('/test/admin-only', bearerHeader(token)),
        401,
        unauthorized,
      );
    });

    it('when its token has expired', async () => {
      const token = await testApp.tokenOf({
        roles: ['admin'],
        expiresAt: new Date(Date.now() - 60 * 1000),
      });

      await expectErrorResponse(
        await ask('/v1/caller', bearerHeader(token)),
        401,
        unauthorized,
      );
    });

    it('when its token never expires, because it does not say when it does', async () => {
      const token = await testApp.tokenOf({ roles: ['admin'], expiresAt: null });

      await expectErrorResponse(
        await ask('/v1/caller', bearerHeader(token)),
        401,
        unauthorized,
      );
    });

    it('when its token comes from another issuer', async () => {
      const token = await signToken(testApp.key, {
        issuer: `${testApp.keycloak.issuer.replace('/realms/pcp', '/realms/another')}`,
        roles: ['admin'],
      });

      await expectErrorResponse(
        await ask('/v1/caller', bearerHeader(token)),
        401,
        unauthorized,
      );
    });

    it('when its token was issued for another audience', async () => {
      const token = await testApp.tokenOf({ roles: ['admin'], audience: 'account' });

      await expectErrorResponse(
        await ask('/v1/caller', bearerHeader(token)),
        401,
        unauthorized,
      );
    });

    it('when its token names no signing algorithm', async () => {
      const token = unsignedToken({ issuer: testApp.keycloak.issuer, roles: ['admin'] });

      await expectErrorResponse(
        await ask('/v1/caller', bearerHeader(token)),
        401,
        unauthorized,
      );
    });

    it('when its token is signed symmetrically, with the public key as the secret', async () => {
      const token = await tokenSignedWithThePublicKeyAsSecret(testApp.key, {
        issuer: testApp.keycloak.issuer,
        roles: ['admin'],
      });

      await expectErrorResponse(
        await ask('/v1/caller', bearerHeader(token)),
        401,
        unauthorized,
      );
    });

    it('when it carries no token, also at an endpoint with no access rule', async () => {
      await expectErrorResponse(await ask('/test/no-access-rule'), 401, unauthorized);
    });
  });

  describe('a good login that is not allowed is answered 403', () => {
    it('when it holds no platform role', async () => {
      const token = await testApp.tokenOf({ roles: [] });

      await expectErrorResponse(
        await ask('/v1/caller', bearerHeader(token)),
        403,
        accessDenied,
      );
    });

    it('when a Vendor calls an endpoint for the Admin only', async () => {
      const token = await testApp.tokenOf({ roles: ['vendor'] });

      await expectErrorResponse(
        await ask('/test/admin-only', bearerHeader(token)),
        403,
        accessDenied,
      );
    });

    it('when the endpoint has no access rule, whoever calls it', async () => {
      const token = await testApp.tokenOf({ roles: ['admin'] });

      await expectErrorResponse(
        await ask('/test/no-access-rule', bearerHeader(token)),
        403,
        accessDenied,
      );
    });
  });

  describe('a call that is allowed is answered', () => {
    it('when the Admin calls an endpoint for the Admin only', async () => {
      const response = await ask(
        '/test/admin-only',
        bearerHeader(await testApp.tokenOf({ roles: ['admin'] })),
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ reached: true });
    });

    it('when a role is spelt in another case in the token', async () => {
      const response = await ask(
        '/test/admin-only',
        bearerHeader(await testApp.tokenOf({ roles: ['Admin'] })),
      );

      expect(response.status).toBe(200);
    });

    it('when anyone calls a public endpoint with no token', async () => {
      expect((await ask('/v1/status')).status).toBe(200);
    });

    it('when anyone calls a public endpoint with a bad token', async () => {
      expect((await ask('/v1/status', bearerHeader('nonsense'))).status).toBe(200);
    });
  });

  describe("the realm's keys", () => {
    it('are fetched once and kept, however many requests are verified', async () => {
      const token = await testApp.tokenOf({ roles: ['admin'] });
      await ask('/v1/caller', bearerHeader(token));
      const fetchedSoFar = testApp.keycloak.keyRequests();

      await ask('/v1/caller', bearerHeader(token));
      await ask('/v1/caller', bearerHeader(token));

      expect(fetchedSoFar).toBeGreaterThan(0);
      expect(testApp.keycloak.keyRequests()).toBe(fetchedSoFar);
    });

    it('are fetched again when a token names a key the API does not have, though not at once', async () => {
      // The API has fetched the keys by now. The realm then starts to sign
      // with a new key, which it publishes beside the old one.
      await ask('/v1/caller', bearerHeader(await testApp.tokenOf({ roles: ['admin'] })));
      const newKey = await createTestKey();
      testApp.keycloak.publish(testApp.key, newKey);
      const token = await signToken(newKey, {
        issuer: testApp.keycloak.issuer,
        roles: ['admin'],
      });

      // Within half a minute of its last fetch the API does not ask the realm
      // again, so that tokens with made-up key names cannot make it ask
      // without end.
      expect((await ask('/v1/caller', bearerHeader(token))).status).toBe(401);

      letHalfAMinutePass();

      expect((await ask('/v1/caller', bearerHeader(token))).status).toBe(200);
    });

    it('do not serve a token that does not say which of two keys signed it', async () => {
      // The realm publishes two keys, and the API has fetched both.
      const otherKey = await createTestKey();
      testApp.keycloak.publish(testApp.key, otherKey);
      letHalfAMinutePass();
      const known = await signToken(otherKey, {
        issuer: testApp.keycloak.issuer,
        roles: ['admin'],
      });
      expect((await ask('/v1/caller', bearerHeader(known))).status).toBe(200);

      const token = await signTokenWithoutKeyName(testApp.key, {
        issuer: testApp.keycloak.issuer,
        roles: ['admin'],
      });

      await expectErrorResponse(
        await ask('/v1/caller', bearerHeader(token)),
        401,
        unauthorized,
      );
    });
  });
});

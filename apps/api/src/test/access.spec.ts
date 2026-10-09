import { Controller, Get } from '@nestjs/common';
import { PreAuthorize, Role } from '@pcp/core';
import {
  bearerHeader,
  createTestKey,
  expectErrorResponse,
  KeycloakStandIn,
  signToken,
  startKeycloakStandIn,
  TestKey,
  TokenOptions,
  tokenSignedWithThePublicKeyAsSecret,
  unsignedToken,
  withChangedClaims,
} from '@pcp/core/test-utils';

import { createTestApp, TestApp } from './test-utils/create-test-app';

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
  let keycloak: KeycloakStandIn;
  let key: TestKey;
  let testApp: TestApp;

  beforeAll(async () => {
    keycloak = await startKeycloakStandIn();
    key = await createTestKey();
    keycloak.publish(key);

    process.env.KEYCLOAK_ISSUER = keycloak.issuer;
    testApp = await createTestApp({ controllers: [ProbeController] });
  });

  afterAll(async () => {
    await testApp.app.close();
    await keycloak.stop();
  });

  function ask(path: string, headers: Record<string, string> = {}): Promise<Response> {
    return fetch(`${testApp.baseUrl}${path}`, { headers });
  }

  function tokenOf(options: Omit<TokenOptions, 'issuer'> = {}): Promise<string> {
    return signToken(key, { issuer: keycloak.issuer, ...options });
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
      const impostor = { ...(await createTestKey()), kid: key.kid };
      const token = await signToken(impostor, {
        issuer: keycloak.issuer,
        roles: ['admin'],
      });

      await expectErrorResponse(
        await ask('/v1/caller', bearerHeader(token)),
        401,
        unauthorized,
      );
    });

    it('when the claims of its token were changed after signing', async () => {
      const token = withChangedClaims(await tokenOf({ roles: ['vendor'] }), {
        realm_access: { roles: ['admin'] },
      });

      await expectErrorResponse(
        await ask('/test/admin-only', bearerHeader(token)),
        401,
        unauthorized,
      );
    });

    it('when its token has expired', async () => {
      const token = await tokenOf({
        roles: ['admin'],
        expiresAt: new Date(Date.now() - 60 * 1000),
      });

      await expectErrorResponse(
        await ask('/v1/caller', bearerHeader(token)),
        401,
        unauthorized,
      );
    });

    it('when its token comes from another issuer', async () => {
      const token = await signToken(key, {
        issuer: `${keycloak.issuer.replace('/realms/pcp', '/realms/another')}`,
        roles: ['admin'],
      });

      await expectErrorResponse(
        await ask('/v1/caller', bearerHeader(token)),
        401,
        unauthorized,
      );
    });

    it('when its token was issued for another audience', async () => {
      const token = await tokenOf({ roles: ['admin'], audience: 'account' });

      await expectErrorResponse(
        await ask('/v1/caller', bearerHeader(token)),
        401,
        unauthorized,
      );
    });

    it('when its token names no signing algorithm', async () => {
      const token = unsignedToken({ issuer: keycloak.issuer, roles: ['admin'] });

      await expectErrorResponse(
        await ask('/v1/caller', bearerHeader(token)),
        401,
        unauthorized,
      );
    });

    it('when its token is signed symmetrically, with the public key as the secret', async () => {
      const token = await tokenSignedWithThePublicKeyAsSecret(key, {
        issuer: keycloak.issuer,
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
      const token = await tokenOf({ roles: [] });

      await expectErrorResponse(
        await ask('/v1/caller', bearerHeader(token)),
        403,
        accessDenied,
      );
    });

    it('when a Vendor calls an endpoint for the Admin only', async () => {
      const token = await tokenOf({ roles: ['vendor'] });

      await expectErrorResponse(
        await ask('/test/admin-only', bearerHeader(token)),
        403,
        accessDenied,
      );
    });

    it('when the endpoint has no access rule, whoever calls it', async () => {
      const token = await tokenOf({ roles: ['admin'] });

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
        bearerHeader(await tokenOf({ roles: ['admin'] })),
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ reached: true });
    });

    it('when a role is spelt in another case in the token', async () => {
      const response = await ask(
        '/test/admin-only',
        bearerHeader(await tokenOf({ roles: ['Admin'] })),
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
      const token = await tokenOf({ roles: ['admin'] });
      await ask('/v1/caller', bearerHeader(token));
      const fetchedSoFar = keycloak.keyRequests();

      await ask('/v1/caller', bearerHeader(token));
      await ask('/v1/caller', bearerHeader(token));

      expect(fetchedSoFar).toBeGreaterThan(0);
      expect(keycloak.keyRequests()).toBe(fetchedSoFar);
    });

    it('are fetched again when a token names a key the API does not have', async () => {
      // The API has fetched the keys by now. The realm then starts to sign
      // with a new key, which it publishes beside the old one.
      await ask('/v1/caller', bearerHeader(await tokenOf({ roles: ['admin'] })));
      const newKey = await createTestKey();
      keycloak.publish(key, newKey);
      const token = await signToken(newKey, { issuer: keycloak.issuer, roles: ['admin'] });

      // The API does not ask the realm again within half a minute of its last
      // fetch, so that tokens with made-up key names cannot make it ask
      // without end. Half a minute is let pass.
      const later = Date.now() + 31 * 1000;
      const clock = jest.spyOn(Date, 'now').mockReturnValue(later);
      try {
        const response = await ask('/v1/caller', bearerHeader(token));

        expect(response.status).toBe(200);
      } finally {
        clock.mockRestore();
      }
    });
  });
});

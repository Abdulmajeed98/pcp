import {
  bearerHeader,
  createTestKey,
  expectErrorResponse,
  signToken,
  startKeycloakStandIn,
} from '@pcp/core/test-utils';

import { createTestApp, TestApp } from './test-utils/create-test-app';

describe('the API while Keycloak cannot be reached', () => {
  let issuer: string;
  let testApp: TestApp;

  beforeAll(async () => {
    // An address where a realm was and no longer is.
    const keycloak = await startKeycloakStandIn();
    issuer = keycloak.issuer;
    await keycloak.stop();

    process.env.KEYCLOAK_ISSUER = issuer;
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('starts, and answers a public endpoint', async () => {
    const response = await fetch(`${testApp.baseUrl}/v1/status`);

    expect(response.status).toBe(200);
  });

  it('refuses a request that carries a token with a server error, and never lets it through', async () => {
    const token = await signToken(await createTestKey(), { issuer, roles: ['admin'] });

    const response = await fetch(`${testApp.baseUrl}/v1/caller`, {
      headers: bearerHeader(token),
    });

    await expectErrorResponse(response, 503, [
      {
        code: 'SERVICE_UNAVAILABLE',
        title: 'service_unavailable_title',
        detail: 'service_unavailable_details',
      },
    ]);
  });

  it('still answers a request with no token as it always does', async () => {
    const response = await fetch(`${testApp.baseUrl}/v1/caller`);

    expect(response.status).toBe(401);
  });
});

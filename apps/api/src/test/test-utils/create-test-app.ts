import { Type } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import {
  createTestKey,
  KeycloakStandIn,
  signToken,
  startKeycloakStandIn,
  TestKey,
  TokenOptions,
} from '@pcp/core/test-utils';

export type TestApp = {
  app: NestExpressApplication;
  baseUrl: string;
};

type TestAppOptions = {
  // Endpoints a test needs and the real API does not have.
  controllers?: Type[];
};

// Builds the application the way the real start does: from the real root
// module, set up by the same function, and listening on a port. The port is a
// free one, and requests are sent to it over HTTP.
export async function createTestApp(options: TestAppOptions = {}): Promise<TestApp> {
  // Imported here and not at the top of the file. The root module reads the
  // settings when it is loaded, so a test can still change one before this.
  const { AppModule } = await import('~/app.module');
  const { configureApplication } = await import('../../bootstrap');

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
    controllers: options.controllers ?? [],
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
  configureApplication(app);
  await app.listen(0, '127.0.0.1');

  return { app, baseUrl: await app.getUrl() };
}

export type TestAppWithLogins = TestApp & {
  // What stands in for Keycloak, and the key its tokens are signed with.
  keycloak: KeycloakStandIn;
  key: TestKey;
  // A token as the realm would issue it, for a login with these roles.
  tokenOf(options?: Omit<TokenOptions, 'issuer'>): Promise<string>;
  close(): Promise<void>;
};

// The application with a stand-in for Keycloak beside it, for a test that
// calls an endpoint as someone. The API is told that the stand-in is its
// realm before it reads its settings.
export async function createTestAppWithLogins(
  options: TestAppOptions = {},
): Promise<TestAppWithLogins> {
  const keycloak = await startKeycloakStandIn();
  const key = await createTestKey();
  keycloak.publish(key);

  process.env.KEYCLOAK_ISSUER = keycloak.issuer;
  // An application that cannot be built would leave the stand-in listening,
  // and Jest would wait for it for ever instead of reporting the failure.
  let testApp: TestApp;
  try {
    testApp = await createTestApp(options);
  } catch (error) {
    await keycloak.stop();
    throw error;
  }

  return {
    ...testApp,
    keycloak,
    key,
    tokenOf: (tokenOptions = {}) =>
      signToken(key, { issuer: keycloak.issuer, ...tokenOptions }),
    close: async () => {
      await testApp.app.close();
      await keycloak.stop();
    },
  };
}

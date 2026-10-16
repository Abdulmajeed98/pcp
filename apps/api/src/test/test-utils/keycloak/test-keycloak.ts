import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';

const repositoryRoot = join(__dirname, '..', '..', '..', '..', '..', '..');
const keycloakServices = join(repositoryRoot, 'services', 'keycloak');

// Keycloak's own administrator in the test's container, who reads what a
// Login holds. It is not the platform's Admin.
export const testAdministrator = {
  name: 'test-administrator',
  password: 'test-administrator-password',
};

// The image the development services run, read from their Compose file, so
// that the tests meet the same Keycloak.
function developmentImage(): string {
  const compose = readFileSync(join(repositoryRoot, 'compose.yaml'), 'utf8');
  const [image] = compose.match(/quay\.io\/keycloak\/keycloak:[^\s'"]+/) ?? [];
  if (image === undefined) throw new Error('compose.yaml names no Keycloak image');
  return image;
}

// Where the test's Keycloak is, the secret its realm gave the API's client,
// and the container, which a test pauses to see what the API does then.
export type TestKeycloakSettings = {
  url: string;
  clientSecret: string;
  containerId: string;
};

// Starts Keycloak in a container, in development mode, importing the
// repository's realm file and theme as the development services do. The
// realm file names an environment setting for the API's client's secret, and
// the test gives it one of its own.
async function startKeycloak(): Promise<{
  container: StartedTestContainer;
  settings: TestKeycloakSettings;
}> {
  const clientSecret = randomBytes(24).toString('base64url');
  const container = await new GenericContainer(developmentImage())
    .withCommand(['start-dev', '--import-realm'])
    .withEnvironment({
      KC_BOOTSTRAP_ADMIN_USERNAME: testAdministrator.name,
      KC_BOOTSTRAP_ADMIN_PASSWORD: testAdministrator.password,
      KC_HEALTH_ENABLED: 'true',
      PCP_API_CLIENT_SECRET: clientSecret,
    })
    .withCopyDirectoriesToContainer([
      { source: join(keycloakServices, 'import'), target: '/opt/keycloak/data/import' },
      { source: join(keycloakServices, 'themes'), target: '/opt/keycloak/themes' },
    ])
    .withExposedPorts(8080, 9000)
    // Ready once the realm is imported and Keycloak answers.
    .withWaitStrategy(Wait.forHttp('/health/ready', 9000))
    .withStartupTimeout(120_000)
    .start();

  return {
    container,
    settings: {
      url: `http://${container.getHost()}:${container.getMappedPort(8080)}`,
      clientSecret,
      containerId: container.getId(),
    },
  };
}

// Jest's global set-up and its global teardown share `globalThis`, and
// nothing else, so the container is kept there between the two.
const keycloakKey = Symbol.for('@pcp/api/test-keycloak');
type WithKeycloak = { [keycloakKey]?: StartedTestContainer };

// Starts the Keycloak that every test file of a run shares. It is meant for
// Jest's global set-up.
export async function startTestKeycloak(): Promise<TestKeycloakSettings> {
  const { container, settings } = await startKeycloak();
  (globalThis as WithKeycloak)[keycloakKey] = container;
  return settings;
}

// Stops the Keycloak the global set-up started. It is meant for Jest's global
// teardown.
export async function stopTestKeycloak(): Promise<void> {
  const holder = globalThis as WithKeycloak;
  await holder[keycloakKey]?.stop();
  delete holder[keycloakKey];
}

// Points the API's settings at a Keycloak, for the API a test builds next.
// The realm and the client keep their defaults, which are the realm file's.
// The container's identifier is the test's own.
export function useKeycloak(settings: TestKeycloakSettings): void {
  process.env.KEYCLOAK_URL = settings.url;
  process.env.KEYCLOAK_CLIENT_SECRET = settings.clientSecret;
  process.env.TEST_KEYCLOAK_CONTAINER_ID = settings.containerId;
}

// The Keycloak the global set-up started, as `useKeycloak` named it.
export function testKeycloakSettings(): TestKeycloakSettings {
  const {
    KEYCLOAK_URL: url,
    KEYCLOAK_CLIENT_SECRET: clientSecret,
    TEST_KEYCLOAK_CONTAINER_ID: containerId,
  } = process.env;
  if (!url || !clientSecret || !containerId) {
    throw new Error(
      'There is no test Keycloak. Run this test with "pnpm integration:check".',
    );
  }

  return { url, clientSecret, containerId };
}

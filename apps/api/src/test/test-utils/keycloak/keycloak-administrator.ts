import { getContainerRuntimeClient } from 'testcontainers';

import { testAdministrator, testKeycloakSettings } from './test-keycloak';

// The realm the repository's realm file makes.
const realm = 'pcp';

// What Keycloak's administration interface says of a Login, as far as the
// tests read it.
export type LoginAsKept = {
  id: string;
  username: string;
  enabled: boolean;
  email?: string;
  firstName?: string;
  lastName?: string;
  requiredActions: string[];
};

// What the token address answered.
export type TokenAnswer = {
  status: number;
  body: { error?: string; error_description?: string; access_token?: string };
};

async function tokenOf(realmName: string, form: Record<string, string>): Promise<Response> {
  const { url } = testKeycloakSettings();
  return fetch(`${url}/realms/${realmName}/protocol/openid-connect/token`, {
    method: 'POST',
    body: new URLSearchParams(form),
  });
}

// Sends one request to the administration interface of the test's realm, as
// Keycloak's own administrator of the container, logged in for this request.
async function asAdministrator(path: string, init: RequestInit = {}): Promise<Response> {
  const login = await tokenOf('master', {
    grant_type: 'password',
    client_id: 'admin-cli',
    username: testAdministrator.name,
    password: testAdministrator.password,
  });
  if (!login.ok) {
    throw new Error(`The test's Keycloak administrator could not log in (${login.status})`);
  }
  const { access_token: token } = (await login.json()) as { access_token: string };

  const response = await fetch(
    `${testKeycloakSettings().url}/admin/realms/${realm}${path}`,
    {
      ...init,
      headers: {
        ...init.headers,
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
    },
  );
  if (!response.ok) {
    throw new Error(
      `Keycloak answered ${response.status} to ${init.method ?? 'GET'} ${path}`,
    );
  }
  return response;
}

// Every Login whose name is exactly this one.
export async function loginsNamed(name: string): Promise<LoginAsKept[]> {
  const response = await asAdministrator(
    `/users?${new URLSearchParams({ username: name, exact: 'true' })}`,
  );
  return (await response.json()) as LoginAsKept[];
}

// The realm roles a Login holds, by their names.
export async function realmRolesOf(loginId: string): Promise<string[]> {
  const response = await asAdministrator(`/users/${loginId}/role-mappings/realm`);
  const roles = (await response.json()) as { name: string }[];
  return roles.map((role) => role.name);
}

// Makes a Login by hand, as someone in Keycloak's own console would.
export async function makeALoginByHand(name: string): Promise<void> {
  await asAdministrator('/users', {
    method: 'POST',
    body: JSON.stringify({ username: name, enabled: true }),
  });
}

// Gives a Login a lasting password, as its own: what the Login holds once
// the Vendor has replaced its temporary password at its first login.
export async function chooseOwnPassword(loginId: string, password: string): Promise<void> {
  await asAdministrator(`/users/${loginId}/reset-password`, {
    method: 'PUT',
    body: JSON.stringify({ type: 'password', value: password, temporary: false }),
  });
}

// The Login's sessions that Keycloak still holds open, by their identifiers.
export async function sessionsOf(loginId: string): Promise<string[]> {
  const response = await asAdministrator(`/users/${loginId}/sessions`);
  const sessions = (await response.json()) as { id: string }[];
  return sessions.map((session) => session.id);
}

// Removes every Login a test made, so that the next test starts from a realm
// with none. The service account of the API's client belongs to the realm
// file, and is kept.
export async function emptyTheRealm(): Promise<void> {
  const response = await asAdministrator('/users?briefRepresentation=true&max=1000');
  const logins = (await response.json()) as LoginAsKept[];

  for (const login of logins) {
    if (login.username.startsWith('service-account-')) continue;
    await asAdministrator(`/users/${login.id}`, { method: 'DELETE' });
  }
}

// A client of the test's own, added to the container's realm and never to
// the realm file, through which a test asks the token address whether a
// password is a Login's.
const passwordCheckClient = 'test-password-check';

export async function addThePasswordCheckClient(): Promise<void> {
  await asAdministrator('/clients', {
    method: 'POST',
    body: JSON.stringify({
      clientId: passwordCheckClient,
      publicClient: true,
      directAccessGrantsEnabled: true,
      standardFlowEnabled: false,
    }),
  });
}

export async function removeThePasswordCheckClient(): Promise<void> {
  const response = await asAdministrator(
    `/clients?${new URLSearchParams({ clientId: passwordCheckClient })}`,
  );
  const [client] = (await response.json()) as { id: string }[];
  if (client !== undefined) {
    await asAdministrator(`/clients/${client.id}`, { method: 'DELETE' });
  }
}

// Asks the token address for a token for a Login, with its name and a
// password, as a login screen would.
export async function logInAt(name: string, password: string): Promise<TokenAnswer> {
  const response = await tokenOf(realm, {
    grant_type: 'password',
    client_id: passwordCheckClient,
    username: name,
    password,
  });
  return { status: response.status, body: (await response.json()) as TokenAnswer['body'] };
}

// The test's Keycloak container, paused while the function runs and then let
// go again, whatever the function did. A paused Keycloak takes connections
// and answers none, as one that has stopped responding does.
export async function whileKeycloakIsPaused(run: () => Promise<void>): Promise<void> {
  const client = await getContainerRuntimeClient();
  const container = client.container.getById(testKeycloakSettings().containerId);

  await container.pause();
  try {
    await run();
  } finally {
    await container.unpause();
  }
}

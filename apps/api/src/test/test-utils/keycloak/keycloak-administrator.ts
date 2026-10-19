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

// The Login with this identifier, as Keycloak keeps it.
export async function loginWithId(loginId: string): Promise<LoginAsKept> {
  const response = await asAdministrator(`/users/${loginId}`);
  return (await response.json()) as LoginAsKept;
}

// Gives a Login a lasting password, as a Vendor's first login does when it
// replaces its temporary one, so that it can log in and hold a session.
export async function giveALastingPassword(
  loginId: string,
  password: string,
): Promise<void> {
  await asAdministrator(`/users/${loginId}/reset-password`, {
    method: 'PUT',
    body: JSON.stringify({ type: 'password', value: password, temporary: false }),
  });
}

// A fault planted in the realm for as long as the function runs: a password
// policy that a temporary password of twelve characters fails, so that
// Keycloak refuses to give a Login one and answers every other call. The
// realm's own policy is put back, whatever the function did.
export async function whileTheRealmRefusesTemporaryPasswords(
  run: () => Promise<void>,
): Promise<void> {
  const { passwordPolicy } = (await (await asAdministrator('')).json()) as {
    passwordPolicy: string;
  };

  await asAdministrator('', {
    method: 'PUT',
    body: JSON.stringify({
      passwordPolicy: passwordPolicy.replace(/length\(\d+\)/, 'length(13)'),
    }),
  });
  try {
    await run();
  } finally {
    await asAdministrator('', { method: 'PUT', body: JSON.stringify({ passwordPolicy }) });
  }
}

// The sessions a Login holds now, by their identifiers.
export async function sessionsOf(loginId: string): Promise<string[]> {
  const response = await asAdministrator(`/users/${loginId}/sessions`);
  const sessions = (await response.json()) as { id: string }[];
  return sessions.map((session) => session.id);
}

// Makes a Login by hand, as someone in Keycloak's own console would.
export async function makeALoginByHand(name: string): Promise<void> {
  await asAdministrator('/users', {
    method: 'POST',
    body: JSON.stringify({ username: name, enabled: true }),
  });
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

// What Keycloak's account interface answered.
export type AccountAnswer = { status: number; body: unknown };

// Asks Keycloak's account interface, as the Login itself, logged in at the
// token address with its name and its lasting password, to change the
// Login's name, as its account pages would send the change.
export async function renameItselfInItsAccount(
  name: string,
  password: string,
  newName: string,
): Promise<AccountAnswer> {
  const login = await logInAt(name, password);
  if (login.body.access_token === undefined) {
    throw new Error(`The Login ${name} could not log in (${login.status})`);
  }
  const account = `${testKeycloakSettings().url}/realms/${realm}/account/`;
  const headers = {
    authorization: `Bearer ${login.body.access_token}`,
    accept: 'application/json',
    'content-type': 'application/json',
  };

  const read = await fetch(account, { headers });
  if (!read.ok) throw new Error(`The account interface answered ${read.status}`);
  const asKept = (await read.json()) as Record<string, unknown>;
  const changed = await fetch(account, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...asKept, username: newName }),
  });
  const text = await changed.text();
  return {
    status: changed.status,
    body: text === '' ? null : (JSON.parse(text) as unknown),
  };
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

// Speaks to Keycloak's administration interface as Keycloak's own
// administrator, whose name and password are in `.env`. That account opens
// Keycloak's console during development. It is not the platform's Admin.
// Also speaks to it as the API's own client, as the API does.
export const keycloakUrl = 'http://localhost:8080';

// The password flow: a client hands a name and a password straight to a
// realm's token address and asks for a token.
export function requestTokenWithPassword(realm, client, username, password) {
  return fetch(`${realm}/protocol/openid-connect/token`, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: client,
      username,
      password,
    }),
  });
}

// A function that sends one request to the administration interface of the
// `pcp` realm with a token. A login lasts a minute, so the function is used
// at once and not kept.
function askWith(token) {
  return (path, { headers, ...request } = {}) =>
    fetch(`${keycloakUrl}/admin/realms/pcp${path}`, {
      ...request,
      headers: { ...headers, authorization: `Bearer ${token}` },
    });
}

// Logs in as Keycloak's own administrator and returns a function that sends
// one request to the administration interface of the `pcp` realm.
export async function logInAsAdministrator(settings) {
  const login = await requestTokenWithPassword(
    `${keycloakUrl}/realms/master`,
    'admin-cli',
    settings.KEYCLOAK_ADMINISTRATOR_NAME,
    settings.KEYCLOAK_ADMINISTRATOR_PASSWORD,
  );
  if (!login.ok) {
    throw new Error(`Keycloak's own administrator could not log in (${login.status})`);
  }
  const { access_token: token } = await login.json();

  return askWith(token);
}

// The API's own client in the `pcp` realm, whose secret is in `.env`.
export const apiClient = 'pcp-api';

// Asks the realm's token address for a token as the API's client, with its
// secret, the way the API logs in. `form` adds to the request or changes it.
export function requestTokenAsTheApisClient(settings, form = {}) {
  return fetch(`${keycloakUrl}/realms/pcp/protocol/openid-connect/token`, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: apiClient,
      client_secret: settings.PCP_API_CLIENT_SECRET,
      ...form,
    }),
  });
}

// Logs in as the API's client, as the API does, and returns a function that
// sends one request to the administration interface of the `pcp` realm with
// what that client may do.
export async function logInAsTheApisClient(settings) {
  const login = await requestTokenAsTheApisClient(settings);
  if (!login.ok) {
    const { error, error_description: description } = await login.json();
    throw new Error(`Keycloak answered ${login.status}, ${error}: ${description}`);
  }
  const { access_token: token } = await login.json();

  return askWith(token);
}

// Finds a login of the `pcp` realm by its name, and answers with nothing when
// the realm has none of that name. Keycloak matches any login whose name
// contains the one asked for, unless it is told that the name is exact.
export async function findLogin(ask, name) {
  const response = await ask(
    `/users?${new URLSearchParams({ username: name, exact: 'true' })}`,
  );
  if (response.status !== 200) {
    throw new Error(`Keycloak answered ${response.status} when asked for the login`);
  }
  const [login] = await response.json();

  return login;
}

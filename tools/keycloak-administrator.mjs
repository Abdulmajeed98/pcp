// Speaks to Keycloak's administration interface as Keycloak's own
// administrator, whose name and password are in `.env`. That account opens
// Keycloak's console during development. It is not the platform's Admin.
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

// Logs in as Keycloak's own administrator and returns a function that sends
// one request to the administration interface of the `pcp` realm. The login
// lasts a minute, so the function is used at once and not kept.
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

  return (path, { headers, ...request } = {}) =>
    fetch(`${keycloakUrl}/admin/realms/pcp${path}`, {
      ...request,
      headers: { ...headers, authorization: `Bearer ${token}` },
    });
}

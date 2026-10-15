import Keycloak from 'keycloak-js';

import { settings } from '@/shared/config';

// Keycloak's own adapter for an app that runs in the browser. It keeps the
// tokens in memory and in no storage, so a reload goes back through Keycloak,
// which answers from its own session without asking for the password.
const keycloak = new Keycloak({
  url: settings.keycloakUrl,
  realm: settings.keycloakRealm,
  clientId: settings.keycloakClientId,
});

// A token is renewed when it has less than this many seconds left.
const leastValidity = 30;

// Starts the login, once, before anything is rendered. It finishes only when
// someone is logged in: someone who is not is sent to Keycloak's login screen,
// with the authorisation code flow and a PKCE challenge, and arrives back at
// a fresh load of the dashboard.
export async function startLogin(): Promise<void> {
  await keycloak.init({
    onLoad: 'login-required',
    pkceMethod: 'S256',
    // The adapter can watch Keycloak's session through a hidden frame.
    // Browsers that block third-party cookies switch that off anyway.
    checkLoginIframe: false,
  });
}

// The realm roles of the login, read from the access token's
// `realm_access.roles`, the claim the API reads them from. They are there as
// soon as the login has started. The API checks the token itself, so these
// decide only what the dashboard shows.
export function realmRolesOfTheLogin(): readonly string[] {
  return keycloak.realmAccess?.roles ?? [];
}

// A token that is still valid, for one call to the API. A token that is about
// to run out is renewed first.
export async function validToken(): Promise<string | undefined> {
  try {
    await keycloak.updateToken(leastValidity);
  } catch (error) {
    // When Keycloak refuses to renew, the session there is over. The adapter
    // then drops its tokens and, because the dashboard requires a login,
    // sends the browser to the login screen itself. The page is on its way
    // out, so this call is left waiting and no request is made.
    if (!keycloak.authenticated) return new Promise<never>(() => {});

    // Any other failure means that Keycloak could not be asked. That is no
    // reason to leave the page, nor to call the API with a token that may
    // have run out, so the call fails and the page says so.
    throw error;
  }

  return keycloak.token;
}

// Ends the session in Keycloak and comes back to the dashboard, which then
// sends whoever is there to the login screen.
export async function logOut(): Promise<void> {
  await keycloak.logout({ redirectUri: `${window.location.origin}/` });
}

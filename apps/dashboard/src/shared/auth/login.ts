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

// A token that is still valid, for one call to the API. A token that is about
// to run out is renewed first. When Keycloak will not renew it, the session
// there is over, and the login starts again.
export async function validToken(): Promise<string | undefined> {
  try {
    await keycloak.updateToken(leastValidity);
  } catch {
    await keycloak.login();
  }

  return keycloak.token;
}

// Ends the session in Keycloak and comes back to the dashboard, which then
// sends whoever is there to the login screen.
export async function logOut(): Promise<void> {
  await keycloak.logout({ redirectUri: `${window.location.origin}/` });
}

function setting(value: unknown, developmentValue: string): string {
  return typeof value === 'string' && value !== '' ? value : developmentValue;
}

// The dashboard's settings. Vite fixes each one when the app is built, from
// an environment variable of the same name in capitals after `VITE_`. Each
// has the development value as its default, and none of them is a secret:
// everything here ends up in the browser.
export const settings = {
  keycloakUrl: setting(import.meta.env.VITE_KEYCLOAK_URL, 'http://localhost:8080'),
  keycloakRealm: setting(import.meta.env.VITE_KEYCLOAK_REALM, 'pcp'),
  keycloakClientId: setting(import.meta.env.VITE_KEYCLOAK_CLIENT_ID, 'dashboard'),
  apiUrl: setting(import.meta.env.VITE_API_URL, 'http://localhost:3001'),
};

// The tests that `pnpm check` runs reach no database and no Keycloak: the API
// connects to either only when a call needs it, and none of these calls does.
// The API still refuses to start without the database password and the API's
// client's secret, so these tests give it values that are never used. A test
// that is about either sets or removes it itself.
process.env.DATASOURCE_PASSWORD ??= 'never-used-by-these-tests';
process.env.KEYCLOAK_CLIENT_SECRET ??= 'never-used-by-these-tests';

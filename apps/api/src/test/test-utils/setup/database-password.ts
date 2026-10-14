// The tests that `pnpm check` runs reach no database: the API connects only
// when a call needs it, and none of these calls does. The API still refuses
// to start without a database password, so these tests give it one that is
// never used. A test that is about the password sets or removes it itself.
process.env.DATASOURCE_PASSWORD ??= 'never-used-by-these-tests';

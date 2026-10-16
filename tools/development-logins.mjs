// The development Admin: the one Login `pnpm services:up` creates in the `pcp`
// realm, with the platform's `admin` role, so that the Admin console can be
// logged in to during development. Its name and password are the two
// settings named here, in `.env`. `label` is how the scripts speak of it, and
// is also the last name Keycloak shows beside "Development".
export const developmentAdmin = {
  label: 'Admin',
  nameSetting: 'DEVELOPMENT_ADMIN_NAME',
  passwordSetting: 'DEVELOPMENT_ADMIN_PASSWORD',
  role: 'admin',
};

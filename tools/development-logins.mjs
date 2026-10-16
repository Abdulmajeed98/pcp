// The development logins `pnpm services:up` creates in the `pcp` realm. There
// is one, the development Admin, which logs in to the Admin console. It holds
// one platform role, `role`, and not the other, `otherRole`. Its name and
// password are the two settings named here, in `.env`. `label` is how the
// scripts speak of it, and is also the last name Keycloak shows beside
// "Development".
//
// A development Vendor stood beside it until the accounts module retired it.
// A Vendor is now made through the API, as the Admin makes one, and logs in
// as a real Vendor does. A value an older `.env` still holds for it is read
// by nothing.
export const developmentLogins = [
  {
    label: 'Admin',
    nameSetting: 'DEVELOPMENT_ADMIN_NAME',
    passwordSetting: 'DEVELOPMENT_ADMIN_PASSWORD',
    role: 'admin',
    otherRole: 'vendor',
  },
];

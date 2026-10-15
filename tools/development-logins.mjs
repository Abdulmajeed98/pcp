// The two development logins `pnpm services:up` creates in the `pcp` realm,
// one for each half of the dashboard: the development Admin and the
// development Vendor. Each holds one platform role, `role`, and not the
// other, `otherRole`. Its name and password are the two settings named here,
// in `.env`. `label` is how the scripts speak of it, and is also the last
// name Keycloak shows beside "Development".
export const developmentLogins = [
  {
    label: 'Admin',
    nameSetting: 'DEVELOPMENT_ADMIN_NAME',
    passwordSetting: 'DEVELOPMENT_ADMIN_PASSWORD',
    role: 'admin',
    otherRole: 'vendor',
  },
  {
    label: 'Vendor',
    nameSetting: 'DEVELOPMENT_VENDOR_NAME',
    passwordSetting: 'DEVELOPMENT_VENDOR_PASSWORD',
    role: 'vendor',
    otherRole: 'admin',
  },
];

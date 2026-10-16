const nxPreset = require('@nx/jest/preset').default;

// Packages that are published as ES modules only. Jest loads CommonJS, and
// leaves everything in node_modules as it is, so these are named here to be
// transformed like the workspace's own source. `jose` is the API's check of
// tokens; the rest are Keycloak's admin client and the packages it imports
// that publish no CommonJS.
const esModulesOnly = [
  'jose',
  '@keycloak/keycloak-admin-client',
  '@microsoft/kiota-abstractions',
  '@microsoft/kiota-http-fetchlibrary',
  '@microsoft/kiota-serialization-form',
  '@microsoft/kiota-serialization-json',
  '@microsoft/kiota-serialization-multipart',
  '@microsoft/kiota-serialization-text',
  'camelize-ts',
  'url-template',
];

// pnpm keeps a package under two folders named node_modules, and the pattern
// has to let both through: `.pnpm/@scope+name@1.0.0/` and `@scope/name/`.
const inPnpmStore = esModulesOnly.map((name) => name.replace('/', '\\+')).join('|');
const linked = esModulesOnly.join('|');

module.exports = {
  ...nxPreset,
  transformIgnorePatterns: [`/node_modules/(?!\\.pnpm/(${inPnpmStore})@|(${linked})/)`],
};

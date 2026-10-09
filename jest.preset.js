const nxPreset = require('@nx/jest/preset').default;

// Packages that are published as ES modules only. Jest loads CommonJS, and
// leaves everything in node_modules as it is, so these are named here to be
// transformed like the workspace's own source. pnpm keeps a package under two
// folders named node_modules, and the pattern has to let both through.
const esModulesOnly = ['jose'];
const named = esModulesOnly.join('|');

module.exports = {
  ...nxPreset,
  transformIgnorePatterns: [`/node_modules/(?!\\.pnpm/(${named})@|(${named})/)`],
};

const { readFileSync } = require('fs');

// Reading the SWC compilation config for the spec files
const swcJestConfig = JSON.parse(readFileSync(`${__dirname}/.spec.swcrc`, 'utf-8'));

// Disable .swcrc look-up by SWC core because we're passing in swcJestConfig ourselves
swcJestConfig.swcrc = false;

// The tests against a real PostgreSQL, which `pnpm integration:check` runs.
// The global set-up starts one database in a container for every test file of
// a run and the teardown stops it, so the files run one after another.
module.exports = {
  displayName: '@pcp/api integration',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  // Tests live under src/test, mirroring src/app
  testMatch: ['<rootDir>/src/test/**/*.integration-spec.ts'],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/app/$1',
  },
  globalSetup: '<rootDir>/src/test/test-utils/database/global-setup.ts',
  globalTeardown: '<rootDir>/src/test/test-utils/database/global-teardown.ts',
  // Starting the container can take a while the first time its image is used.
  testTimeout: 30000,
  coverageDirectory: 'test-output/jest/integration-coverage',
};

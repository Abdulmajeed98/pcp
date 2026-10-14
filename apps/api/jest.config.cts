const { readFileSync } = require('fs');

// Reading the SWC compilation config for the spec files
const swcJestConfig = JSON.parse(readFileSync(`${__dirname}/.spec.swcrc`, 'utf-8'));

// Disable .swcrc look-up by SWC core because we're passing in swcJestConfig ourselves
swcJestConfig.swcrc = false;

module.exports = {
  displayName: '@pcp/api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  // Tests live under src/test, mirroring src/app
  testMatch: ['<rootDir>/src/test/**/*.spec.ts'],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/app/$1',
  },
  setupFiles: ['<rootDir>/src/test/test-utils/setup/database-password.ts'],
  coverageDirectory: 'test-output/jest/coverage',
};

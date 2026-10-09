// Checks the running platform from the outside, in a real browser, and
// prints one line for each thing it checked. It exits non-zero when any line
// fails. Run it with `pnpm platform:check`.
//
// The tests are the `@pcp/e2e` project, written with Playwright. They start
// the three apps that are not running and stop them again. The development
// services are not started from here: this script makes sure they are
// running before any test, and says so plainly when they are not.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

import { keycloakUrl } from './keycloak-administrator.mjs';

const startHint = 'Start the services with "pnpm services:up".';

const root = join(import.meta.dirname, '..');
const envFile = join(root, '.env');

function exitWith(message) {
  console.log(message);
  process.exit(1);
}

if (!existsSync(envFile)) {
  exitWith(`There is no .env file, so the services have never been started. ${startHint}`);
}
const settings = parseEnv(readFileSync(envFile, 'utf8'));
if (!settings.DEVELOPMENT_ADMIN_NAME || !settings.DEVELOPMENT_ADMIN_PASSWORD) {
  exitWith(`.env does not hold the development Admin's name and password. ${startHint}`);
}

// The realm's public description answers only when Keycloak is up and the
// platform's realm is loaded.
async function realmAnswers() {
  try {
    const response = await fetch(
      `${keycloakUrl}/realms/pcp/.well-known/openid-configuration`,
    );
    return response.ok;
  } catch {
    return false;
  }
}

if (!(await realmAnswers())) {
  exitWith(`Keycloak cannot be reached, so the services are not running. ${startHint}`);
}

// Never answered from Nx's cache: a pass has to mean that the platform ran.
const tests = spawnSync('pnpm', ['exec', 'nx', 'e2e', '@pcp/e2e', '--skip-nx-cache'], {
  cwd: root,
  stdio: 'inherit',
});
process.exitCode = tests.status ?? 1;

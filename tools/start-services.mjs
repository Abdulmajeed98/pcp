// Starts the development services in the background and returns when they are
// healthy. On the first start it also creates the local environment file.
// Run it with `pnpm services:up`.
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

const root = join(import.meta.dirname, '..');
const envFile = join(root, '.env');

// A setting whose name ends in _PASSWORD gets a random value. Any other
// setting needs a value here.
const fixedValues = { KEYCLOAK_ADMIN_USERNAME: 'keycloak-admin' };

function valueFor(name) {
  if (name in fixedValues) return fixedValues[name];
  if (name.endsWith('_PASSWORD')) return randomBytes(24).toString('base64url');
  throw new Error(`.env.example lists ${name}, and this script has no value for it.`);
}

// The names come from .env.example, so the settings are listed in one place.
// A file that already exists is never changed: the services' data was created
// with the passwords in it.
function createEnvFileIfMissing() {
  if (existsSync(envFile)) return;

  const names = Object.keys(parseEnv(readFileSync(join(root, '.env.example'), 'utf8')));
  const lines = [
    '# Created by `pnpm services:up`. The passwords are random and local to',
    '# this machine. .env.example says what each setting is.',
    ...names.map((name) => `${name}=${valueFor(name)}`),
  ];
  writeFileSync(envFile, `${lines.join('\n')}\n`, { mode: 0o600 });
  console.log('Created .env with new local passwords.');
}

function stop(message) {
  console.error(message);
  process.exit(1);
}

const docker = spawnSync('docker', ['info'], { stdio: 'ignore' });
if (docker.error?.code === 'ENOENT') {
  stop('Docker is not installed, or the "docker" command is not on the PATH.');
}
if (docker.status !== 0) {
  stop('Docker is not running. Start Docker, then run "pnpm services:up" again.');
}

createEnvFileIfMissing();

const compose = spawnSync('docker', ['compose', 'up', '--detach', '--wait'], {
  cwd: root,
  stdio: 'inherit',
});
process.exitCode = compose.status ?? 1;

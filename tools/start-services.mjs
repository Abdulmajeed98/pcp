// Starts the development services in the background and returns when they are
// healthy, the development Admin and Vendor logins exist and the platform's
// database has every migration. On the first start it also creates the local environment
// file. Run it with `pnpm services:up`.
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

import { findLogin, logInAsAdministrator } from './keycloak-administrator.mjs';

const root = join(import.meta.dirname, '..');
const envFile = join(root, '.env');

// A setting whose name ends in _PASSWORD gets a random value. Any other
// setting needs a value here.
const fixedValues = {
  KEYCLOAK_ADMINISTRATOR_NAME: 'keycloak-administrator',
  DEVELOPMENT_ADMIN_NAME: 'development-admin',
  DEVELOPMENT_VENDOR_NAME: 'development-vendor',
};

function valueFor(name) {
  if (name in fixedValues) return fixedValues[name];
  if (name.endsWith('_PASSWORD')) return randomBytes(24).toString('base64url');
  throw new Error(`.env.example lists ${name}, and this script has no value for it.`);
}

// The names come from .env.example, so the settings are listed in one place.
// A value that is in the file is never changed: the services' data was
// created with the passwords in it. A setting the file lacks is added, which
// is how a file written before the setting existed gains it.
function writeMissingSettings() {
  const names = Object.keys(parseEnv(readFileSync(join(root, '.env.example'), 'utf8')));

  if (!existsSync(envFile)) {
    const lines = [
      '# Created by `pnpm services:up`. The passwords are random and local to',
      '# this machine. .env.example says what each setting is.',
      ...names.map((name) => `${name}=${valueFor(name)}`),
    ];
    writeFileSync(envFile, `${lines.join('\n')}\n`, { mode: 0o600 });
    console.log('Created .env with new local passwords.');
    return;
  }

  const text = readFileSync(envFile, 'utf8');
  const present = parseEnv(text);
  const missing = names.filter((name) => !(name in present));
  if (missing.length === 0) return;

  const lines = [
    '# Added by `pnpm services:up`, which adds a setting that is new.',
    ...missing.map((name) => `${name}=${valueFor(name)}`),
  ];
  appendFileSync(envFile, `${text.endsWith('\n') ? '' : '\n'}${lines.join('\n')}\n`);
  console.log(`Added to .env: ${missing.join(', ')}.`);
}

function exitWith(message) {
  console.error(message);
  process.exit(1);
}

async function expectStatus(response, expected, doing) {
  if (response.status === expected) return;
  throw new Error(`Keycloak answered ${response.status} when asked to ${doing}`);
}

// The two development logins, one for each half of the dashboard. Each holds
// one platform role and no other. `lastName` is what Keycloak shows beside
// "Development".
const developmentLogins = [
  {
    nameSetting: 'DEVELOPMENT_ADMIN_NAME',
    passwordSetting: 'DEVELOPMENT_ADMIN_PASSWORD',
    lastName: 'Admin',
    role: 'admin',
  },
  {
    nameSetting: 'DEVELOPMENT_VENDOR_NAME',
    passwordSetting: 'DEVELOPMENT_VENDOR_PASSWORD',
    lastName: 'Vendor',
    role: 'vendor',
  },
];

// The realm file holds no logins, so each development login is created here,
// through Keycloak's administration interface. A login that exists is left as
// it is, its password included.
async function createDevelopmentLoginIfMissing({
  nameSetting,
  passwordSetting,
  lastName,
  role: roleName,
}) {
  const settings = parseEnv(readFileSync(envFile, 'utf8'));
  const name = settings[nameSetting];
  const password = settings[passwordSetting];
  if (!name || !password) {
    throw new Error(`.env has no value for ${nameSetting} or ${passwordSetting}`);
  }

  const ask = await logInAsAdministrator(settings);
  const json = { 'content-type': 'application/json' };

  if ((await findLogin(ask, name)) !== undefined) return;

  const role = await ask(`/roles/${roleName}`);
  await expectStatus(role, 200, `read the ${roleName} role`);

  const created = await ask('/users', {
    method: 'POST',
    headers: json,
    body: JSON.stringify({
      username: name,
      enabled: true,
      // Keycloak's default profile asks a login for these three. It lets a
      // login be created without them, and then sends it to a screen that
      // asks for them before it may log in.
      firstName: 'Development',
      lastName,
      email: `${name}@pcp.invalid`,
      emailVerified: true,
      credentials: [{ type: 'password', value: password, temporary: false }],
    }),
  });
  await expectStatus(created, 201, 'create the login');
  const id = created.headers.get('location').split('/').at(-1);

  const given = await ask(`/users/${id}/role-mappings/realm`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify([await role.json()]),
  });
  if (!given.ok) {
    // The next start would find a login without its role and leave it as it
    // is. Removing it lets the next start begin again.
    await ask(`/users/${id}`, { method: 'DELETE' });
    await expectStatus(given, 204, `give the login the ${roleName} role`);
  }

  console.log(
    `Created the development ${lastName} login, ${name}. Its password is in .env.`,
  );
}

const docker = spawnSync('docker', ['info'], { stdio: 'ignore' });
if (docker.error?.code === 'ENOENT') {
  exitWith('Docker is not installed, or the "docker" command is not on the PATH.');
}
if (docker.status !== 0) {
  exitWith('Docker is not running. Start Docker, then run "pnpm services:up" again.');
}

writeMissingSettings();

const compose = spawnSync('docker', ['compose', 'up', '--detach', '--wait'], {
  cwd: root,
  stdio: 'inherit',
});
if (compose.status !== 0) process.exit(compose.status ?? 1);

for (const developmentLogin of developmentLogins) {
  try {
    await createDevelopmentLoginIfMissing(developmentLogin);
  } catch (error) {
    exitWith(
      `The development ${developmentLogin.lastName} login could not be created: ${error.message}.`,
    );
  }
}

// The platform's database gets the API's migrations from `pnpm db:migrate`
// itself, which says what it applied.
const migrated = spawnSync('pnpm', ['db:migrate'], { cwd: root, stdio: 'inherit' });
if (migrated.status !== 0) {
  exitWith('The migrations could not be applied. Run "pnpm db:migrate" to see why.');
}

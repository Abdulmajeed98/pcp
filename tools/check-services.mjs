// Checks the running development services from the outside, the way their
// clients meet them, and prints one line for each thing it checked. It exits
// non-zero when any line fails. Run it with `pnpm services:check`.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { connect } from 'node:net';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

const START_HINT = 'Start the services with "pnpm services:up".';

const root = join(import.meta.dirname, '..');
const envFile = join(root, '.env');

if (!existsSync(envFile)) {
  console.log(
    `There is no .env file, so the services have never been started. ${START_HINT}`,
  );
  process.exit(1);
}
const settings = parseEnv(readFileSync(envFile, 'utf8'));

let failures = 0;

async function check(name, assertion) {
  try {
    await assertion();
    console.log(`pass  ${name}`);
    return true;
  } catch (error) {
    failures += 1;
    console.log(`FAIL  ${name}: ${error.message}`);
    return false;
  }
}

// Asks the server whether it speaks TLS, which is how a PostgreSQL client
// opens a connection. Only PostgreSQL answers with a single "S" or "N". An
// open port alone proves nothing: Docker accepts connections on a published
// port even when nothing behind it is listening.
function askPostgres() {
  const sslRequest = Buffer.alloc(8);
  sslRequest.writeInt32BE(8, 0);
  sslRequest.writeInt32BE(80877103, 4);

  return new Promise((resolve, reject) => {
    const socket = connect({ host: '127.0.0.1', port: 5432 });
    socket.setTimeout(3000, () => socket.destroy(new Error('no answer within 3 seconds')));
    socket.once('connect', () => socket.write(sslRequest));
    socket.once('data', (reply) => {
      const answer = reply.toString('latin1');
      socket.destroy();
      if (answer === 'S' || answer === 'N') resolve();
      else reject(new Error('something other than PostgreSQL answered'));
    });
    socket.once('error', (error) => reject(new Error(error.code ?? error.message)));
    socket.once('close', () =>
      reject(new Error('the connection closed without an answer')),
    );
  });
}

// Runs one statement with the client inside the PostgreSQL container, so that
// no database driver is needed here. It connects to the container's network
// address, not its loopback address, because PostgreSQL asks for a password
// only there. That is what a client outside the container meets.
function psql({ user, password, database }, statement) {
  const inContainer = ['compose', 'exec', '--no-TTY', '--env', 'PGPASSWORD', 'postgres'];
  const connection = ['--host', 'postgres', '--username', user, '--dbname', database];
  const format = ['--no-psqlrc', '--tuples-only', '--no-align'];
  const result = spawnSync(
    'docker',
    [...inContainer, 'psql', ...connection, ...format, '--command', statement],
    { cwd: root, encoding: 'utf8', env: { ...process.env, PGPASSWORD: password } },
  );
  if (result.error) throw result.error;
  return {
    connected: result.status === 0,
    output: result.stdout.trim(),
    error: reason(result.stderr),
  };
}

// What PostgreSQL said went wrong, without the address it was said from. Its
// reason is on the line marked FATAL or ERROR, and a line of detail may follow.
function reason(stderr) {
  const lines = stderr.trim().split('\n');
  const line = lines.find((each) => /(FATAL|ERROR):/.test(each)) ?? lines.at(-1);
  return line.replace(/^.*(FATAL|ERROR):\s+/, '');
}

const superuser = { user: 'postgres', password: settings.POSTGRES_PASSWORD };

function databaseExists(name) {
  return () => {
    const found = psql(
      { ...superuser, database: 'postgres' },
      `SELECT count(*) FROM pg_database WHERE datname = '${name}'`,
    );
    if (!found.connected) throw new Error(found.error);
    if (found.output !== '1') throw new Error('PostgreSQL has no database of that name');
  };
}

const platformUser = { user: 'pcp', password: settings.PCP_DB_PASSWORD };
const keycloakUser = { user: 'keycloak', password: settings.KEYCLOAK_DB_PASSWORD };

function connects(user, database) {
  return () => {
    const attempt = psql({ ...user, database }, 'SELECT 1');
    if (!attempt.connected) throw new Error(attempt.error);
  };
}

// A refusal counts only when PostgreSQL gives this reason. A wrong password
// or a missing database also stops a connection, and neither shows that the
// user is kept out of the database.
function isRefused(user, database) {
  return () => {
    const attempt = psql({ ...user, database }, 'SELECT 1');
    if (attempt.connected) throw new Error('the connection was accepted');
    if (!attempt.error.includes(`permission denied for database "${database}"`)) {
      throw new Error(`the connection failed for another reason: ${attempt.error}`);
    }
  };
}

const postgresAnswers = await check('PostgreSQL answers on port 5432', askPostgres);
if (postgresAnswers) {
  await check('The pcp database exists', databaseExists('pcp'));
  await check('The keycloak database exists', databaseExists('keycloak'));
  await check('The pcp user connects to the pcp database', connects(platformUser, 'pcp'));
  await check(
    'The keycloak user connects to the keycloak database',
    connects(keycloakUser, 'keycloak'),
  );
  await check(
    'The pcp user is refused by the keycloak database',
    isRefused(platformUser, 'keycloak'),
  );
  await check(
    'The keycloak user is refused by the pcp database',
    isRefused(keycloakUser, 'pcp'),
  );
} else {
  console.log(`      PostgreSQL cannot be reached. ${START_HINT}`);
}

const KEYCLOAK = 'http://localhost:8080';
const REALM = `${KEYCLOAK}/realms/pcp`;

// Keycloak's own realm, `master`, always exists, so its public description
// answers whenever Keycloak is up, whatever state the platform's realm is in.
async function askKeycloak() {
  let response;
  try {
    response = await fetch(`${KEYCLOAK}/realms/master`);
  } catch (error) {
    throw new Error(error.cause?.code ?? error.message, { cause: error });
  }
  const description = response.ok ? await response.json() : {};
  if (description.realm !== 'master') {
    throw new Error('something other than Keycloak answered');
  }
}

async function discoveryNamesTheRealm() {
  const response = await fetch(`${REALM}/.well-known/openid-configuration`);
  if (!response.ok) throw new Error(`Keycloak answered ${response.status}`);
  const { issuer } = await response.json();
  if (issuer !== REALM) throw new Error(`the issuer is ${issuer}`);
}

// Logs in as Keycloak's own administrator, for the few things that have no
// behaviour a client could observe and must be read back from Keycloak's
// administration interface.
async function administratorToken() {
  const response = await fetch(`${KEYCLOAK}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: 'admin-cli',
      username: settings.KEYCLOAK_ADMIN_USERNAME,
      password: settings.KEYCLOAK_ADMIN_PASSWORD,
    }),
  });
  if (!response.ok) {
    throw new Error(`Keycloak's own administrator could not log in (${response.status})`);
  }
  return (await response.json()).access_token;
}

async function readAsAdministrator(path) {
  const token = await administratorToken();
  return fetch(`${KEYCLOAK}/admin/realms/pcp${path}`, {
    headers: { authorization: `Bearer ${token}` },
  });
}

function roleExists(name) {
  return async () => {
    const response = await readAsAdministrator(`/roles/${name}`);
    if (response.status === 404) throw new Error('the realm has no role of that name');
    if (!response.ok) throw new Error(`Keycloak answered ${response.status}`);
  };
}

const keycloakAnswers = await check('Keycloak answers on port 8080', askKeycloak);
if (keycloakAnswers) {
  await check(
    "The pcp realm's discovery document names the realm as its issuer",
    discoveryNamesTheRealm,
  );
  await check('The admin role exists', roleExists('admin'));
  await check('The vendor role exists', roleExists('vendor'));
} else {
  console.log(`      Keycloak cannot be reached. ${START_HINT}`);
}

if (failures > 0) process.exitCode = 1;

// Checks the running development services from the outside, the way their
// clients meet them, and prints one line for each thing it checked. It exits
// non-zero when any line fails. Run it with `pnpm services:check`.
import { spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { connect } from 'node:net';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

import {
  keycloakUrl,
  logInAsAdministrator,
  requestTokenWithPassword,
} from './keycloak-administrator.mjs';

const startHint = 'Start the services with "pnpm services:up".';

const root = join(import.meta.dirname, '..');
const envFile = join(root, '.env');

if (!existsSync(envFile)) {
  console.log(
    `There is no .env file, so the services have never been started. ${startHint}`,
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
    error: whatPostgresSaid(result.stderr),
  };
}

// What PostgreSQL said went wrong, without the address it was said from. It
// is on the line marked FATAL or ERROR, and a line of detail may follow.
function whatPostgresSaid(stderr) {
  const lines = stderr.trim().split('\n');
  const line = lines.find((each) => /(FATAL|ERROR):/.test(each)) ?? lines.at(-1);
  return line.replace(/^.*(FATAL|ERROR):\s+/, '');
}

const superuser = {
  user: 'postgres',
  password: settings.POSTGRES_PASSWORD,
  database: 'postgres',
};
const platformUser = { user: 'pcp', password: settings.PCP_DB_PASSWORD };
const keycloakUser = { user: 'keycloak', password: settings.KEYCLOAK_DB_PASSWORD };

function databaseExists(name) {
  return () => {
    const found = psql(
      superuser,
      `SELECT count(*) FROM pg_database WHERE datname = '${name}'`,
    );
    if (!found.connected) throw new Error(found.error);
    if (found.output !== '1') throw new Error('PostgreSQL has no database of that name');
  };
}

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

// Asks PostgreSQL which databases a user may connect to. The refusals above
// try the other user's database. This also covers the databases PostgreSQL
// creates for itself, which are open to every user unless that is taken away.
function mayConnectOnlyTo({ user }, database) {
  return () => {
    const allowed = psql(
      superuser,
      `SELECT string_agg(datname, ', ' ORDER BY datname) FROM pg_database WHERE datallowconn AND has_database_privilege('${user}', datname, 'CONNECT')`,
    );
    if (!allowed.connected) throw new Error(allowed.error);
    if (allowed.output !== database) throw new Error(`it may connect to ${allowed.output}`);
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
  await check(
    'The pcp user may connect to no database but its own',
    mayConnectOnlyTo(platformUser, 'pcp'),
  );
  await check(
    'The keycloak user may connect to no database but its own',
    mayConnectOnlyTo(keycloakUser, 'keycloak'),
  );
} else {
  console.log(`      PostgreSQL cannot be reached. ${startHint}`);
}

const realmUrl = `${keycloakUrl}/realms/pcp`;
const dashboardUrl = 'http://localhost:3002';

function expectStatus(response, expected) {
  if (response.status !== expected) {
    throw new Error(`Keycloak answered ${response.status}`);
  }
}

// Keycloak's own realm, `master`, always exists, so its public description
// answers whenever Keycloak is up, whatever state the platform's realm is in.
async function askKeycloak() {
  let response;
  try {
    response = await fetch(`${keycloakUrl}/realms/master`);
  } catch (error) {
    throw new Error(error.cause?.code ?? error.message, { cause: error });
  }
  const description = response.ok ? await response.json() : {};
  if (description.realm !== 'master') {
    throw new Error('something other than Keycloak answered');
  }
}

async function discoveryNamesTheRealm() {
  const response = await fetch(`${realmUrl}/.well-known/openid-configuration`);
  expectStatus(response, 200);
  const { issuer } = await response.json();
  if (issuer !== realmUrl) throw new Error(`the issuer is ${issuer}`);
}

// Reads from Keycloak's administration interface, as Keycloak's own
// administrator. It is for the few things that have no behaviour a client
// could observe, and so can only be read back.
async function readAsAdministrator(path) {
  const ask = await logInAsAdministrator(settings);
  return ask(path);
}

function roleExists(name) {
  return async () => {
    const response = await readAsAdministrator(`/roles/${name}`);
    if (response.status === 404) throw new Error('the realm has no role of that name');
    expectStatus(response, 200);
  };
}

// What the dashboard sends when it sends someone to Keycloak to log in: the
// authorisation code flow with a PKCE challenge, returning to the dashboard's
// own address. `change` alters one thing about it, to show that Keycloak
// refuses the request once that thing is wrong.
function loginQuery(change = () => {}) {
  const verifier = randomBytes(32).toString('base64url');
  const query = new URLSearchParams({
    client_id: 'dashboard',
    redirect_uri: `${dashboardUrl}/`,
    response_type: 'code',
    scope: 'openid',
    code_challenge: createHash('sha256').update(verifier).digest('base64url'),
    code_challenge_method: 'S256',
  });
  change(query);
  return query;
}

function loginRequest(change) {
  return fetch(`${realmUrl}/protocol/openid-connect/auth?${loginQuery(change)}`, {
    redirect: 'manual',
  });
}

function isLoginScreen(page) {
  return page.includes('id="kc-form-login"');
}

// A client names a language with the `ui_locales` part of the login request.
// With `language` left out the request names none, and Keycloak chooses.
async function openLoginScreen(language) {
  const response = await loginRequest((query) => {
    if (language !== undefined) query.set('ui_locales', language);
  });
  const page = await response.text();
  if (!isLoginScreen(page)) {
    throw new Error(`Keycloak answered ${response.status} without a login form`);
  }
  return page;
}

// Keycloak refuses in two ways. A request it cannot trust at all gets an
// error page. A request from a client it knows is sent back to that client's
// address with an error code, and `expectedError` is the code expected then.
function loginIsRefused(change, expectedError) {
  return async () => {
    const response = await loginRequest(change);
    if (isLoginScreen(await response.text())) {
      throw new Error('the request reached the login screen');
    }
    if (expectedError === undefined) {
      expectStatus(response, 400);
      return;
    }
    const sentBackTo = response.headers.get('location') ?? '';
    if (!sentBackTo.startsWith(`${dashboardUrl}/`)) {
      throw new Error(
        `Keycloak answered ${response.status} and did not send the request back`,
      );
    }
    const { search, hash } = new URL(sentBackTo);
    const error = new URLSearchParams(search || hash.slice(1)).get('error');
    if (error !== expectedError) throw new Error(`the error code given was ${error}`);
  };
}

// A client that may not use the password flow is told so before the password
// is even looked at.
async function passwordFlowIsRefused() {
  const response = await requestTokenWithPassword(realmUrl, 'dashboard', 'nobody', 'wrong');
  const { error } = await response.json();
  if (error !== 'unauthorized_client') {
    throw new Error(`Keycloak looked at the password and answered ${error}`);
  }
}

function loginScreenLacks(link) {
  return async () => {
    const page = await openLoginScreen();
    if (page.includes(link)) throw new Error('the link is on the login screen');
  };
}

async function signUpAddressRefuses() {
  const response = await fetch(
    `${realmUrl}/protocol/openid-connect/registrations?${loginQuery()}`,
  );
  const page = await response.text();
  if (page.includes('id="kc-register-form"')) throw new Error('it serves the sign-up form');
  expectStatus(response, 400);
}

// One phrase from each language's login screen. The English and the Arabic
// are Keycloak's own wording. The Kurdish is the theme's draft, so when that
// wording changes this copy changes with it.
const languages = [
  { name: 'Kurdish', tag: 'ckb', direction: 'rtl', heading: 'چوونەژوورەوە بۆ هەژمارەکەت' },
  { name: 'Arabic', tag: 'ar', direction: 'rtl', heading: 'تسجيل الدخول إلى حسابك' },
  { name: 'English', tag: 'en', direction: 'ltr', heading: 'Sign in to your account' },
];
const directions = { rtl: 'right to left', ltr: 'left to right' };

// What the page says about itself in its opening <html> tag.
function declared(page, attribute) {
  return page.match(new RegExp(`<html[^>]*\\s${attribute}="([^"]*)"`))?.[1];
}

// Makes sure a login screen came back in the language meant. When Keycloak
// does not offer a language it serves the default one instead, and a check
// made on that page would say nothing about the language asked for.
function inLanguage(tag, page) {
  const language = declared(page, 'lang');
  if (language !== tag) throw new Error(`the page says its language is ${language}`);
  return page;
}

function loginScreenIsServedIn({ tag, heading }) {
  return async () => {
    const page = inLanguage(tag, await openLoginScreen(tag));
    if (!page.includes(heading)) throw new Error(`the page does not say "${heading}"`);
  };
}

function loginScreenIsLaidOut({ tag, direction }) {
  return async () => {
    const page = inLanguage(tag, await openLoginScreen(tag));
    const declaredDirection = declared(page, 'dir');
    if (declaredDirection !== direction) {
      throw new Error(`the page declares the direction ${declaredDirection}`);
    }
  };
}

async function unaskedLoginScreenIsKurdish() {
  inLanguage('ckb', await openLoginScreen());
}

async function defaultLanguageIsKurdish() {
  const response = await readAsAdministrator('');
  expectStatus(response, 200);
  const { defaultLocale } = await response.json();
  if (defaultLocale !== 'ckb') throw new Error(`the default language is ${defaultLocale}`);
}

// The development Admin is the one login the start command creates. Its name
// is in `.env`, beside its password.
async function findDevelopmentAdmin() {
  const name = settings.DEVELOPMENT_ADMIN_NAME;
  if (!name) throw new Error(`.env does not name it. ${startHint}`);

  // Keycloak matches any login whose name contains the one asked for, unless
  // it is told that the name is exact.
  const query = new URLSearchParams({ username: name, exact: 'true' });
  const response = await readAsAdministrator(`/users?${query}`);
  expectStatus(response, 200);
  const [login] = await response.json();
  if (login === undefined) throw new Error(`the realm has no login named ${name}`);
  return login;
}

async function developmentAdminExists() {
  const login = await findDevelopmentAdmin();
  if (!login.enabled) throw new Error('the login is switched off');
}

// The realm roles a login holds, the ones it holds through another role
// among them.
async function realmRolesOfDevelopmentAdmin() {
  const { id } = await findDevelopmentAdmin();
  const response = await readAsAdministrator(`/users/${id}/role-mappings/realm/composite`);
  expectStatus(response, 200);
  return (await response.json()).map((role) => role.name);
}

function developmentAdminHolds(role) {
  return async () => {
    const roles = await realmRolesOfDevelopmentAdmin();
    if (!roles.includes(role)) throw new Error(`its realm roles are ${roles.join(', ')}`);
  };
}

function developmentAdminLacks(role) {
  return async () => {
    const roles = await realmRolesOfDevelopmentAdmin();
    if (roles.includes(role)) throw new Error('it holds the role');
  };
}

// A token can be had only by logging in, so the mapper that names the API in
// the dashboard's tokens is read back.
async function dashboardMapperNamesTheApi() {
  const response = await readAsAdministrator('/clients?clientId=dashboard');
  expectStatus(response, 200);
  const [client] = await response.json();
  const mapper = (client?.protocolMappers ?? []).find(
    (each) =>
      each.protocolMapper === 'oidc-audience-mapper' &&
      each.config?.['included.custom.audience'] === 'pcp-api',
  );
  if (mapper === undefined)
    throw new Error('the client has no audience mapper for pcp-api');
  if (mapper.config['access.token.claim'] !== 'true') {
    throw new Error('the mapper does not add the audience to access tokens');
  }
}

const keycloakAnswers = await check('Keycloak answers on port 8080', askKeycloak);
if (keycloakAnswers) {
  await check(
    "The pcp realm's discovery document names the realm as its issuer",
    discoveryNamesTheRealm,
  );
  await check('The admin role exists', roleExists('admin'));
  await check('The vendor role exists', roleExists('vendor'));
  const loginScreenOpens = await check(
    "A login request from the dashboard's address with a PKCE challenge reaches the login screen",
    () => openLoginScreen(),
  );
  // Each line below changes one thing about that request, or reads that
  // screen. None of them means anything unless the request itself works.
  if (loginScreenOpens) {
    await check(
      'The same request returning to another address is refused',
      loginIsRefused((query) => query.set('redirect_uri', 'https://example.com/')),
    );
    await check(
      'The same request without a PKCE challenge is refused',
      loginIsRefused((query) => {
        query.delete('code_challenge');
        query.delete('code_challenge_method');
      }, 'invalid_request'),
    );
    await check(
      'The same request asking for the implicit flow is refused',
      loginIsRefused((query) => {
        query.set('response_type', 'token');
        query.set('nonce', 'check');
      }, 'unauthorized_client'),
    );
    await check('The password flow is refused', passwordFlowIsRefused);
    await check(
      'The login screen offers no sign-up link',
      loginScreenLacks('login-actions/registration'),
    );
    await check(
      'The login screen offers no "forgot password" link',
      loginScreenLacks('login-actions/reset-credentials'),
    );
    await check('The sign-up address refuses', signUpAddressRefuses);
    for (const language of languages) {
      await check(
        `The login screen is served in ${language.name}, with its text`,
        loginScreenIsServedIn(language),
      );
      await check(
        `The ${language.name} login screen is laid out ${directions[language.direction]}`,
        loginScreenIsLaidOut(language),
      );
    }
    await check(
      'The login screen is in Kurdish when the request names no language',
      unaskedLoginScreenIsKurdish,
    );
  }
  await check("Kurdish is the realm's default language", defaultLanguageIsKurdish);
  await check(
    "The dashboard client's audience mapper names pcp-api",
    dashboardMapperNamesTheApi,
  );
  const developmentAdminFound = await check(
    'The development Admin login exists',
    developmentAdminExists,
  );
  if (developmentAdminFound) {
    await check(
      'The development Admin holds the admin role',
      developmentAdminHolds('admin'),
    );
    await check(
      'The development Admin does not hold the vendor role',
      developmentAdminLacks('vendor'),
    );
  }
} else {
  console.log(`      Keycloak cannot be reached. ${startHint}`);
}

if (failures > 0) process.exitCode = 1;

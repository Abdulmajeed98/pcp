import { createHmac, randomUUID } from 'node:crypto';

import {
  type CryptoKey,
  exportJWK,
  exportSPKI,
  generateKeyPair,
  type JWK,
  type JWTPayload,
  SignJWT,
} from 'jose';

// A key pair made for one test run. Its public half is what the stand-in for
// Keycloak publishes, and its private half signs the tokens of the test.
export type TestKey = {
  kid: string;
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  publicJwk: JWK;
};

export async function createTestKey(): Promise<TestKey> {
  const { publicKey, privateKey } = await generateKeyPair('RS256', { extractable: true });
  const kid = randomUUID();
  const publicJwk = { ...(await exportJWK(publicKey)), kid, alg: 'RS256', use: 'sig' };

  return { kid, privateKey, publicKey, publicJwk };
}

export type TokenOptions = {
  // The realm the token says it comes from.
  issuer: string;
  audience?: string | string[];
  // The platform roles the login holds. Keycloak's own are added to them.
  roles?: string[];
  loginName?: string;
  subject?: string;
  // When the token expires. `null` makes a token that never says so.
  expiresAt?: Date | null;
};

// The roles Keycloak gives every login, whatever its platform roles are.
const keycloakOwnRoles = ['offline_access', 'default-roles-pcp', 'uma_authorization'];

function seconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

// The claims of an access token as Keycloak writes them for the dashboard's
// login client. They follow a real token, read on 9 October 2026.
export function tokenClaims(options: TokenOptions): JWTPayload {
  const now = new Date();
  const expiresAt =
    options.expiresAt === undefined
      ? new Date(now.getTime() + 5 * 60 * 1000)
      : options.expiresAt;

  return {
    iss: options.issuer,
    aud: options.audience ?? ['pcp-api', 'account'],
    sub: options.subject ?? randomUUID(),
    typ: 'Bearer',
    azp: 'dashboard',
    iat: seconds(now),
    ...(expiresAt === null ? {} : { exp: seconds(expiresAt) }),
    preferred_username: options.loginName ?? 'a-login',
    realm_access: { roles: [...keycloakOwnRoles, ...(options.roles ?? [])] },
    scope: 'openid profile email',
  };
}

export function signToken(key: TestKey, options: TokenOptions): Promise<string> {
  return new SignJWT(tokenClaims(options))
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: key.kid })
    .sign(key.privateKey);
}

// A token that does not say which of the realm's keys signed it. Keycloak
// always says so.
export function signTokenWithoutKeyName(
  key: TestKey,
  options: TokenOptions,
): Promise<string> {
  return new SignJWT(tokenClaims(options))
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .sign(key.privateKey);
}

function encoded(part: object): string {
  return Buffer.from(JSON.stringify(part)).toString('base64url');
}

// A token that names no signing algorithm and carries no signature.
export function unsignedToken(options: TokenOptions): string {
  return `${encoded({ alg: 'none', typ: 'JWT' })}.${encoded(tokenClaims(options))}.`;
}

// A token signed symmetrically, with the published public key as the secret.
// A verifier that lets the token choose its algorithm would accept it.
export async function tokenSignedWithThePublicKeyAsSecret(
  key: TestKey,
  options: TokenOptions,
): Promise<string> {
  const header = encoded({ alg: 'HS256', typ: 'JWT', kid: key.kid });
  const signed = `${header}.${encoded(tokenClaims(options))}`;
  const secret = await exportSPKI(key.publicKey);
  const signature = createHmac('sha256', secret).update(signed).digest('base64url');

  return `${signed}.${signature}`;
}

// The same token with some of its claims changed and its signature left as
// it was.
export function withChangedClaims(token: string, changes: Record<string, unknown>): string {
  const [header, payload, signature] = token.split('.');
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));

  return `${header}.${encoded({ ...claims, ...changes })}.${signature}`;
}

export function bearerHeader(token: string): { authorization: string } {
  return { authorization: `Bearer ${token}` };
}

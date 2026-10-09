import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createRemoteJWKSet,
  errors,
  type JWSAlgorithm,
  type JWTPayload,
  jwtVerify,
  type RemoteJWKSet,
} from 'jose';

import { CoreEnvironmentVariables } from '../configuration/env.validation';

// The token is not one the API accepts. `message` says why, for the log.
export class InvalidAccessToken extends Error {}

// The realm's keys could not be had, so no token can be judged.
export class KeysUnavailable extends Error {}

// Only signatures made with a private key. A token that names a symmetric
// algorithm, or none, is refused whatever it is signed with.
const asymmetricAlgorithms: JWSAlgorithm[] = [
  'RS256',
  'RS384',
  'RS512',
  'PS256',
  'PS384',
  'PS512',
  'ES256',
  'ES384',
  'ES512',
  'EdDSA',
];

// What `jose` raises when the token itself is at fault. Anything else it
// raises is a failure to get or to read the realm's keys.
const tokenFaults = new Set([
  errors.JWTExpired.code,
  errors.JWTClaimValidationFailed.code,
  errors.JWTInvalid.code,
  errors.JWSInvalid.code,
  errors.JWSSignatureVerificationFailed.code,
  errors.JOSEAlgNotAllowed.code,
  errors.JOSENotSupported.code,
  errors.JWKSNoMatchingKey.code,
  // The token does not say which key signed it, and the realm publishes more
  // than one. Keycloak always says which.
  errors.JWKSMultipleMatchingKeys.code,
]);

const discoveryTimeout = 5000;

// Verifies an access token against the realm that issues the platform's
// logins: its signature against the keys the realm publishes, its expiry, its
// issuer and its audience. The workplace's services leave this to a proxy in
// front of them. This API has none, so every token is verified here.
@Injectable()
export class AccessTokenVerifier {
  private readonly issuer: string;
  private readonly audience: string;

  // The realm's keys. They are fetched on first need and not at startup, so
  // the API starts, and its public endpoints answer, without the realm.
  private keys: Promise<RemoteJWKSet> | undefined;

  constructor(configService: ConfigService<CoreEnvironmentVariables, true>) {
    this.issuer = configService.get('KEYCLOAK_ISSUER', { infer: true });
    this.audience = configService.get('KEYCLOAK_AUDIENCE', { infer: true });
  }

  async verify(token: string): Promise<JWTPayload> {
    const keys = await this.publishedKeys();

    try {
      const { payload } = await jwtVerify(token, keys, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: asymmetricAlgorithms,
        // `jose` checks the expiry of a token that states one. A token that
        // states none would otherwise never expire.
        requiredClaims: ['exp'],
      });
      return payload;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      if (error instanceof errors.JOSEError && tokenFaults.has(error.code)) {
        throw new InvalidAccessToken(reason, { cause: error });
      }
      throw new KeysUnavailable(reason, { cause: error });
    }
  }

  private publishedKeys(): Promise<RemoteJWKSet> {
    this.keys ??= this.discoverKeys().catch((error: unknown) => {
      // Forgotten, so that the next request asks the realm again.
      this.keys = undefined;
      const reason = error instanceof Error ? error.message : String(error);
      throw new KeysUnavailable(reason, { cause: error });
    });

    return this.keys;
  }

  // The realm says where its keys are in its discovery document. The key set
  // keeps the keys for ten minutes and then fetches them again, so a key the
  // realm has withdrawn is not trusted for long. It also fetches them again
  // when a token names a key it does not have, though not within thirty
  // seconds of its last fetch, which is how a new key is picked up.
  private async discoverKeys(): Promise<RemoteJWKSet> {
    const response = await fetch(`${this.issuer}/.well-known/openid-configuration`, {
      signal: AbortSignal.timeout(discoveryTimeout),
    });
    if (!response.ok) {
      throw new Error(`the realm answered ${response.status} for its discovery document`);
    }

    const document = (await response.json()) as { issuer?: unknown; jwks_uri?: unknown };
    if (document.issuer !== this.issuer) {
      throw new Error('the discovery document names another issuer');
    }
    if (typeof document.jwks_uri !== 'string') {
      throw new Error('the discovery document does not say where the keys are');
    }

    return createRemoteJWKSet(new URL(document.jwks_uri));
  }
}

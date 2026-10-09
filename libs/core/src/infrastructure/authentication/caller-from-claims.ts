import type { JWTPayload } from 'jose';

import { Caller } from '../../domain/caller/Caller';
import { Role } from '../../domain/caller/Role';

function realmRolesIn(claims: JWTPayload): string[] {
  const realmAccess = claims.realm_access;
  if (typeof realmAccess !== 'object' || realmAccess === null) return [];

  const roles = (realmAccess as { roles?: unknown }).roles;
  return Array.isArray(roles) ? roles.filter((role) => typeof role === 'string') : [];
}

// Reads the caller from the claims of a token that has already been verified.
// Keycloak keeps the login's name in `preferred_username` and its realm roles
// in `realm_access.roles`, among roles of its own that every login carries.
// Returns nothing when the claims do not name a login.
export function callerFromClaims(claims: JWTPayload): Caller | undefined {
  const id = claims.sub;
  const loginName = claims.preferred_username;
  if (typeof id !== 'string' || id === '') return undefined;
  if (typeof loginName !== 'string' || loginName === '') return undefined;

  const roles = Role.values().filter((role) =>
    realmRolesIn(claims).some((roleName) => Role.named(roleName) === role),
  );

  return new Caller(id, loginName, roles);
}

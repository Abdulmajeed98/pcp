import { Role } from '../../../domain/caller/Role';
import { callerFromClaims } from '../../../infrastructure/authentication/caller-from-claims';

// The claims of a real access token for the dashboard's login client, as
// Keycloak wrote them on 9 October 2026, with the identifier made up.
const claims = {
  iss: 'http://localhost:8080/realms/pcp',
  aud: ['pcp-api', 'account'],
  sub: '4d2c1f8e-9a53-4b61-8f0e-2d7c6a1b3e90',
  typ: 'Bearer',
  azp: 'dashboard',
  preferred_username: 'development-admin',
  realm_access: {
    roles: ['offline_access', 'admin', 'default-roles-pcp', 'uma_authorization'],
  },
};

describe('reading the caller from the claims of a token', () => {
  it("reads the login's identifier and its name", () => {
    const caller = callerFromClaims(claims);

    expect(caller?.getId()).toBe('4d2c1f8e-9a53-4b61-8f0e-2d7c6a1b3e90');
    expect(caller?.getLoginName()).toBe('development-admin');
  });

  it('reads the platform roles and leaves out the roles Keycloak gives every login', () => {
    expect(callerFromClaims(claims)?.getRoles()).toEqual([Role.ADMIN]);
  });

  it('reads both platform roles when the login holds both', () => {
    const caller = callerFromClaims({
      ...claims,
      realm_access: { roles: ['vendor', 'admin'] },
    });

    expect(caller?.getRoles()).toEqual([Role.ADMIN, Role.VENDOR]);
  });

  it('reads a role whatever case it is written in', () => {
    const caller = callerFromClaims({ ...claims, realm_access: { roles: ['VENDOR'] } });

    expect(caller?.getRoles()).toEqual([Role.VENDOR]);
  });

  it.each([
    ['no realm roles at all', undefined],
    ['realm roles that are not a list', { roles: 'admin' }],
    ['realm roles that are not names', { roles: [{ name: 'admin' }, 7] }],
  ])('reads a login with %s as one that holds no platform role', (_what, realmAccess) => {
    const caller = callerFromClaims({ ...claims, realm_access: realmAccess });

    expect(caller?.getRoles()).toEqual([]);
  });

  it.each([
    ['no identifier', { sub: undefined }],
    ['an empty identifier', { sub: '' }],
    ['no login name', { preferred_username: undefined }],
    ['a login name that is not text', { preferred_username: 42 }],
  ])('reads no caller from claims with %s', (_what, change) => {
    expect(callerFromClaims({ ...claims, ...change })).toBeUndefined();
  });
});

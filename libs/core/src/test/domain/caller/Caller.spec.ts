import { Caller } from '../../../domain/caller/Caller';
import { Role } from '../../../domain/caller/Role';

describe('a caller', () => {
  const admin = new Caller('4d2c1f8e-9a53-4b61-8f0e-2d7c6a1b3e90', 'an-admin', [
    Role.ADMIN,
  ]);

  it('holds any one of some roles when it holds one of them', () => {
    expect(admin.hasAnyRole([Role.VENDOR, Role.ADMIN])).toBe(true);
  });

  it('does not hold any one of some roles when it holds none of them', () => {
    expect(admin.hasAnyRole([Role.VENDOR])).toBe(false);
  });

  it('holds any one of no roles never', () => {
    expect(admin.hasAnyRole([])).toBe(false);
  });

  it('does not let its roles be changed from outside', () => {
    admin.getRoles().push(Role.VENDOR);

    expect(admin.getRoles()).toEqual([Role.ADMIN]);
  });
});

describe('a platform role', () => {
  it('is found by the name of its realm role, whatever case that is written in', () => {
    expect(Role.named('admin')).toBe(Role.ADMIN);
    expect(Role.named('Vendor')).toBe(Role.VENDOR);
  });

  it("is not found by the name of a role that is not the platform's", () => {
    expect(Role.named('offline_access')).toBeUndefined();
  });
});

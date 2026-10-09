// A platform role. A login holds it as a realm role of the same name.
export class Role {
  static readonly ADMIN = new Role('admin');
  static readonly VENDOR = new Role('vendor');

  private constructor(private readonly roleName: string) {}

  getRoleName(): string {
    return this.roleName;
  }

  static values(): Role[] {
    return [Role.ADMIN, Role.VENDOR];
  }

  // The platform role a realm role names, when it names one. Names are
  // compared without regard to case.
  static named(roleName: string): Role | undefined {
    return Role.values().find((role) => role.roleName === roleName.toLowerCase());
  }
}

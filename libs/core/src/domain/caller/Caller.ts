import { Role } from './Role';

// The login a request to the API was made with.
export class Caller {
  constructor(
    private readonly id: string,
    private readonly loginName: string,
    private readonly roles: Role[],
  ) {}

  // The login's identifier in the identity service.
  getId(): string {
    return this.id;
  }

  getLoginName(): string {
    return this.loginName;
  }

  // The platform roles the login holds, and no others.
  getRoles(): Role[] {
    return [...this.roles];
  }

  hasAnyRole(roles: Role[]): boolean {
    return roles.some((role) => this.roles.includes(role));
  }
}

import { Caller } from '@pcp/core';

export class CallerResponse {
  readonly id: string;
  readonly loginName: string;
  readonly roles: string[];

  private constructor(id: string, loginName: string, roles: string[]) {
    this.id = id;
    this.loginName = loginName;
    this.roles = roles;
  }

  static of(caller: Caller): CallerResponse {
    return new CallerResponse(
      caller.getId(),
      caller.getLoginName(),
      caller.getRoles().map((role) => role.getRoleName()),
    );
  }
}

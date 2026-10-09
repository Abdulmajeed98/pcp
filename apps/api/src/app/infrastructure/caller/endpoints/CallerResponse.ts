import { ApiProperty } from '@nestjs/swagger';
import { Caller, Role } from '@pcp/core';

export class CallerResponse {
  @ApiProperty({
    description: "The login's identifier in the identity service.",
    example: '4d2c1f8e-9a53-4b61-8f0e-2d7c6a1b3e90',
  })
  readonly id: string;

  @ApiProperty({ description: "The login's name.", example: 'development-admin' })
  readonly loginName: string;

  @ApiProperty({
    description: 'The platform roles the login holds.',
    enum: Role.values().map((role) => role.getRoleName()),
    isArray: true,
    example: ['admin'],
  })
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

import { Module } from '@nestjs/common';

import { LoginStore } from '~/domain/login/LoginStore';

import { KeycloakLoginStore } from './store/KeycloakLoginStore';

// Logins, kept in Keycloak. Making or changing one is a Vendor's use case,
// which the Vendor module holds.
@Module({
  providers: [
    // The abstract class is the token the domain asks for.
    { provide: LoginStore, useClass: KeycloakLoginStore },
  ],
  exports: [LoginStore],
})
export class LoginModule {}

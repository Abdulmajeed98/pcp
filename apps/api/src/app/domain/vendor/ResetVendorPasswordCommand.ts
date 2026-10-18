import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { LoginStore } from '../login/LoginStore';
import { makeTemporaryPassword } from '../login/temporary-password';
import { vendorNotFound } from './vendor-errors';
import { VendorStore } from './VendorStore';

class Input {
  constructor(private readonly vendorId: string) {}

  getVendorId(): string {
    return this.vendorId;
  }
}

class Output {
  private constructor(private readonly temporaryPassword: string) {}

  static of(temporaryPassword: string): Output {
    return new Output(temporaryPassword);
  }

  // The Login's new temporary password. This answer is the only place it is
  // kept.
  getTemporaryPassword(): string {
    return this.temporaryPassword;
  }
}

export { Input as ResetVendorPasswordCommandInput };
export { Output as ResetVendorPasswordCommandOutput };

// The Admin resets the password of a Vendor's Login (ACC-5), for a Vendor
// that has forgotten its own or never got the first. The Login is given a new
// temporary password, which it has to replace at its next login, and then its
// sessions are ended, so that whoever knew the old password is logged out.
// The Vendor itself does not change.
//
// A reset that fails after the password was given leaves the sessions open
// and answers why. Doing it again makes another password and ends them.
@Injectable()
export class ResetVendorPasswordCommand {
  constructor(
    private readonly vendorStore: VendorStore,
    private readonly loginStore: LoginStore,
  ) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const vendorId = input.getVendorId();
    const found = await this.vendorStore.readById(vendorId);
    if (Either.isLeft(found)) return Either.left(found.left);
    if (Option.isNone(found.right)) return Either.left(vendorNotFound(vendorId));
    const loginId = found.right.value.getLoginId();

    const temporaryPassword = makeTemporaryPassword();
    const given = await this.loginStore.setTemporaryPassword(loginId, temporaryPassword);
    if (Either.isLeft(given)) return Either.left(given.left);

    const ended = await this.loginStore.endSessions(loginId);
    if (Either.isLeft(ended)) return Either.left(ended.left);

    return Either.right(Output.of(temporaryPassword));
  }
}

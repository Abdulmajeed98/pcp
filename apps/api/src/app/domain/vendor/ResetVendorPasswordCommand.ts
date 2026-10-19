import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { LoginStore } from '../login/LoginStore';
import { makeTemporaryPassword } from '../login/temporary-password';
import { existingVendor } from './existing-vendor';
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
// that has forgotten its own or never got the first. The Login's sessions are
// ended, so that whoever knew the old password is logged out, and then it is
// given a new temporary password, which it has to replace at its next login.
// The Vendor itself does not change.
//
// The sessions come first, so that a reset that fails at the password leaves
// the old password working, as it was, and answers why. Doing it again ends
// any session opened in between and gives the password.
@Injectable()
export class ResetVendorPasswordCommand {
  constructor(
    private readonly vendorStore: VendorStore,
    private readonly loginStore: LoginStore,
  ) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const vendorId = input.getVendorId();
    const found = existingVendor(vendorId, await this.vendorStore.readById(vendorId));
    if (Either.isLeft(found)) return Either.left(found.left);
    const loginId = found.right.getLoginId();

    const ended = await this.loginStore.endSessions(loginId);
    if (Either.isLeft(ended)) return Either.left(ended.left);

    const temporaryPassword = makeTemporaryPassword();
    const given = await this.loginStore.setTemporaryPassword(loginId, temporaryPassword);
    if (Either.isLeft(given)) return Either.left(given.left);

    return Either.right(Output.of(temporaryPassword));
  }
}

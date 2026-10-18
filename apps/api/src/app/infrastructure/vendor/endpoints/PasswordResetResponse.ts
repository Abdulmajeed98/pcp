import { ApiProperty } from '@nestjs/swagger';

import { ResetVendorPasswordCommandOutput } from '~/domain/vendor/ResetVendorPasswordCommand';

// What resetting a Vendor's password answers: its Login's new temporary
// password, which no other answer holds.
export class PasswordResetResponse {
  @ApiProperty({
    description:
      "The new temporary password of the Vendor's Login, which the Vendor replaces at its next login. It is answered this once and kept nowhere else.",
    example: 'k7mx2pq9rt4w',
  })
  readonly temporaryPassword: string;

  private constructor(output: ResetVendorPasswordCommandOutput) {
    this.temporaryPassword = output.getTemporaryPassword();
  }

  static of(output: ResetVendorPasswordCommandOutput): PasswordResetResponse {
    return new PasswordResetResponse(output);
  }
}

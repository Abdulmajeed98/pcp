import { ApiProperty } from '@nestjs/swagger';

import { CreateVendorCommandOutput } from '~/domain/vendor/CreateVendorCommand';

import { VendorResponse } from './VendorResponse';

// What creating a Vendor answers: the Vendor, and its Login's temporary
// password, which no other answer holds.
export class CreatedVendorResponse {
  @ApiProperty({ description: 'The Vendor as it was created.', type: VendorResponse })
  readonly vendor: VendorResponse;

  @ApiProperty({
    description:
      "The temporary password of the Vendor's Login, which the Vendor replaces at its first login. It is answered this once and kept nowhere else.",
    example: 'k7mx2pq9rt4w',
  })
  readonly temporaryPassword: string;

  private constructor(output: CreateVendorCommandOutput) {
    this.vendor = VendorResponse.of(output.getVendor());
    this.temporaryPassword = output.getTemporaryPassword();
  }

  static of(output: CreateVendorCommandOutput): CreatedVendorResponse {
    return new CreatedVendorResponse(output);
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@pcp/core';
import { IsString } from 'class-validator';

import { CreateOfferCommandInput } from '~/domain/offer/CreateOfferCommand';

import { OfferDetailsRequest } from './OfferDetailsRequest';

// A new Offer: the Part offered and the Offer's details.
export class CreateOfferRequest extends OfferDetailsRequest {
  @ApiProperty({
    description: 'The identifier of the Part offered, any Part in the catalog.',
    example: '3b8f0c52-6a1e-4f3d-9c27-5e8a1d4b7f60',
  })
  @IsString()
  readonly partId!: string;

  toCommandInput(
    callerId: string,
    callerRoles: readonly Role[],
    vendorId: string,
  ): CreateOfferCommandInput {
    return new CreateOfferCommandInput(
      callerId,
      callerRoles,
      vendorId,
      this.partId,
      this.uncheckedDetails(),
    );
  }
}

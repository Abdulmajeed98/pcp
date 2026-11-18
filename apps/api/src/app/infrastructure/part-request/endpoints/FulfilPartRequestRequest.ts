import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { FulfilPartRequestCommandInput } from '~/domain/part-request/FulfilPartRequestCommand';

// The Part a Part Request is fulfilled with: any Part in the catalog, of any
// Category, found there or just created from the request.
export class FulfilPartRequestRequest {
  @ApiProperty({
    description: 'The identifier of the Part that fulfils the request, of any Category.',
    example: '3b8f0c52-6a1e-4f3d-9c27-5e8a1d4b7f60',
  })
  @IsString()
  readonly partId!: string;

  toCommandInput(callerId: string, partRequestId: string): FulfilPartRequestCommandInput {
    return new FulfilPartRequestCommandInput(callerId, partRequestId, this.partId);
  }
}

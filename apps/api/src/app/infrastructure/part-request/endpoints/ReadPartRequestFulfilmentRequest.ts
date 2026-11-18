import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { ReadPartRequestFulfilmentQueryInput } from '~/domain/part-request/ReadPartRequestFulfilmentQuery';

// The Part that fulfilling a Part Request would be done with, from the
// address's query, as a fulfilment names it in its body.
export class ReadPartRequestFulfilmentRequest {
  @ApiProperty({
    description:
      'The identifier of the Part the request would be fulfilled with, of any Category.',
    example: '3b8f0c52-6a1e-4f3d-9c27-5e8a1d4b7f60',
  })
  @IsString()
  readonly partId!: string;

  toQueryInput(partRequestId: string): ReadPartRequestFulfilmentQueryInput {
    return new ReadPartRequestFulfilmentQueryInput(partRequestId, this.partId);
  }
}

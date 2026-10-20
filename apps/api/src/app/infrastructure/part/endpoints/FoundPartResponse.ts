import { ApiProperty } from '@nestjs/swagger';
import { Option } from 'effect';

import { Part } from '~/domain/part/Part';

import { PartSummaryResponse } from './PartSummaryResponse';

// A Part as a search of the catalog finds it, with the Offer for it of the
// Vendor whose Offers the search names, when that Vendor has one.
export class FoundPartResponse extends PartSummaryResponse {
  @ApiProperty({
    description:
      "The identifier of the Offer for this Part of the Vendor whose Offers the search names, or null when that Vendor has none or the search names no Vendor's.",
    type: String,
    nullable: true,
    example: '5a7d3e21-9c4b-4f60-8e1a-2b6c0d9f4e83',
  })
  readonly offerId: string | null;

  private constructor(part: Part, offerId: Option.Option<string>) {
    super(part);
    this.offerId = Option.getOrNull(offerId);
  }

  static withOffer(part: Part, offerId: Option.Option<string>): FoundPartResponse {
    return new FoundPartResponse(part, offerId);
  }
}

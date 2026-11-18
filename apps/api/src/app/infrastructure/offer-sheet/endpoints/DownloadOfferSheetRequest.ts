import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@pcp/core';
import { languages } from '@pcp/i18n';
import { IsString, ValidateIf } from 'class-validator';

import { DownloadOfferSheetQueryInput } from '~/domain/offer-sheet/DownloadOfferSheetQuery';
import { given } from '~/infrastructure/vendor/endpoints/ContactDetailsRequest';

// What a download of an Offer sheet asks for, from the address's query: the
// language its words are written in. It is required, so the description
// says so; it is checked here only for its kind, and what it holds is
// checked by the use case, after the rule for which Vendor a request acts
// for, so that a Vendor learns nothing about another Vendor from it.
export class DownloadOfferSheetRequest {
  @ApiProperty({
    description:
      "The language of the file's headings, its yes and no, its worksheet's name and its own name, the portal's current one.",
    enum: languages,
    example: 'ckb',
    type: String,
    required: true,
  })
  @ValidateIf(given)
  @IsString()
  readonly language: string | null = null;

  toQueryInput(
    callerId: string,
    callerRoles: readonly Role[],
    vendorId: string,
  ): DownloadOfferSheetQueryInput {
    return new DownloadOfferSheetQueryInput(callerId, callerRoles, vendorId, this.language);
  }
}

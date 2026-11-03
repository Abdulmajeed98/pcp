import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ErrorStructureException, Public } from '@pcp/core';
import { Either } from 'effect';

import {
  ReadVisibleVendorQuery,
  ReadVisibleVendorQueryInput,
} from '~/domain/vendor/ReadVisibleVendorQuery';

import { VisibleVendorResponse } from './VisibleVendorResponse';

// The active Vendors, as Vendor pages show them, for anyone: the Shopper app
// has no Login. It answers the same with a good token, a bad one or none.
@Controller()
export class VisibleVendorsController {
  constructor(private readonly readVisibleVendorQuery: ReadVisibleVendorQuery) {}

  @ApiOperation({
    summary:
      "An active Vendor's name, city and contact details, as it writes them, with null for each detail it has not given; a deactivated Vendor is answered as one that does not exist",
    security: [],
  })
  @ApiOkResponse({ type: VisibleVendorResponse })
  @Public()
  @Get('v1/visible-vendors/:vendorId')
  async readVisibleVendor(
    @Param('vendorId') vendorId: string,
  ): Promise<VisibleVendorResponse> {
    const result = await this.readVisibleVendorQuery.execute(
      new ReadVisibleVendorQueryInput(vendorId),
    );

    return result.pipe(
      Either.map((output) => VisibleVendorResponse.of(output.getVendor())),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }
}

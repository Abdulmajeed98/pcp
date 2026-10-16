import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ErrorStructureException, PreAuthorize, Role } from '@pcp/core';
import { Either } from 'effect';

import { CreateVendorCommand } from '~/domain/vendor/CreateVendorCommand';
import { ReadVendorQuery, ReadVendorQueryInput } from '~/domain/vendor/ReadVendorQuery';

import { CreatedVendorResponse } from './CreatedVendorResponse';
import { CreateVendorRequest } from './CreateVendorRequest';
import { VendorResponse } from './VendorResponse';

@Controller()
export class VendorController {
  constructor(
    private readonly createVendorCommand: CreateVendorCommand,
    private readonly readVendorQuery: ReadVendorQuery,
  ) {}

  @ApiOperation({
    summary:
      "Create a Vendor and its Login, and answer the Login's temporary password once",
  })
  @ApiCreatedResponse({ type: CreatedVendorResponse })
  @PreAuthorize([Role.ADMIN])
  @Post('v1/vendors')
  async createVendor(@Body() request: CreateVendorRequest): Promise<CreatedVendorResponse> {
    const result = await this.createVendorCommand.execute(request.toCommandInput());

    return result.pipe(
      Either.map(CreatedVendorResponse.of),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }

  @ApiOperation({ summary: 'One Vendor' })
  @ApiOkResponse({ type: VendorResponse })
  @PreAuthorize([Role.ADMIN])
  @Get('v1/vendors/:vendorId')
  async readVendor(@Param('vendorId') vendorId: string): Promise<VendorResponse> {
    const result = await this.readVendorQuery.execute(new ReadVendorQueryInput(vendorId));

    return result.pipe(
      Either.map((output) => VendorResponse.of(output.getVendor())),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }
}

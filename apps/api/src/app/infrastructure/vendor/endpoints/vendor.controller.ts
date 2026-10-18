import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ErrorStructureException, PreAuthorize, Role } from '@pcp/core';
import { Either } from 'effect';

import { CreateVendorCommand } from '~/domain/vendor/CreateVendorCommand';
import { ListVendorsQuery } from '~/domain/vendor/ListVendorsQuery';
import { ReadVendorQuery, ReadVendorQueryInput } from '~/domain/vendor/ReadVendorQuery';

import { CreatedVendorResponse } from './CreatedVendorResponse';
import { CreateVendorRequest } from './CreateVendorRequest';
import { ListVendorsRequest } from './ListVendorsRequest';
import { VendorPageResponse } from './VendorPageResponse';
import { VendorResponse } from './VendorResponse';

@Controller()
export class VendorController {
  constructor(
    private readonly createVendorCommand: CreateVendorCommand,
    private readonly listVendorsQuery: ListVendorsQuery,
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

  @ApiOperation({
    summary: 'One page of every Vendor, active and deactivated, in name order',
  })
  @ApiOkResponse({ type: VendorPageResponse })
  @PreAuthorize([Role.ADMIN])
  @Get('v1/vendors')
  async listVendors(@Query() request: ListVendorsRequest): Promise<VendorPageResponse> {
    const result = await this.listVendorsQuery.execute(request.toQueryInput());

    return result.pipe(
      Either.map((output) => VendorPageResponse.of(output.getVendorsPage())),
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

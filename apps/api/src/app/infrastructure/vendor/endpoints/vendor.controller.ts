import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { CallerResolver, ErrorStructureException, PreAuthorize, Role } from '@pcp/core';
import { Either } from 'effect';

import { CreateVendorCommand } from '~/domain/vendor/CreateVendorCommand';
import {
  DeactivateVendorCommand,
  DeactivateVendorCommandInput,
} from '~/domain/vendor/DeactivateVendorCommand';
import { EditContactDetailsCommand } from '~/domain/vendor/EditContactDetailsCommand';
import { EditVendorCommand } from '~/domain/vendor/EditVendorCommand';
import { ListVendorsQuery } from '~/domain/vendor/ListVendorsQuery';
import {
  ReadCallersVendorQuery,
  ReadCallersVendorQueryInput,
} from '~/domain/vendor/ReadCallersVendorQuery';
import {
  ReactivateVendorCommand,
  ReactivateVendorCommandInput,
} from '~/domain/vendor/ReactivateVendorCommand';
import { ReadVendorQuery, ReadVendorQueryInput } from '~/domain/vendor/ReadVendorQuery';
import {
  ResetVendorPasswordCommand,
  ResetVendorPasswordCommandInput,
} from '~/domain/vendor/ResetVendorPasswordCommand';

import { CreatedVendorResponse } from './CreatedVendorResponse';
import { CreateVendorRequest } from './CreateVendorRequest';
import { EditContactDetailsRequest } from './EditContactDetailsRequest';
import { EditVendorRequest } from './EditVendorRequest';
import { ListVendorsRequest } from './ListVendorsRequest';
import { PasswordResetResponse } from './PasswordResetResponse';
import { VendorPageResponse } from './VendorPageResponse';
import { VendorResponse } from './VendorResponse';

@Controller()
export class VendorController {
  constructor(
    private readonly createVendorCommand: CreateVendorCommand,
    private readonly listVendorsQuery: ListVendorsQuery,
    private readonly readVendorQuery: ReadVendorQuery,
    private readonly readCallersVendorQuery: ReadCallersVendorQuery,
    private readonly editContactDetailsCommand: EditContactDetailsCommand,
    private readonly editVendorCommand: EditVendorCommand,
    private readonly resetVendorPasswordCommand: ResetVendorPasswordCommand,
    private readonly deactivateVendorCommand: DeactivateVendorCommand,
    private readonly reactivateVendorCommand: ReactivateVendorCommand,
    private readonly callerResolver: CallerResolver,
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

  @ApiOperation({
    summary: "One Vendor, for the Admin or for the Vendor's own Login",
  })
  @ApiOkResponse({ type: VendorResponse })
  @PreAuthorize([Role.ADMIN, Role.VENDOR])
  @Get('v1/vendors/:vendorId')
  async readVendor(@Param('vendorId') vendorId: string): Promise<VendorResponse> {
    const caller = this.callerResolver.getCaller();
    const result = await this.readVendorQuery.execute(
      new ReadVendorQueryInput(caller.getId(), caller.getRoles(), vendorId),
    );

    return result.pipe(
      Either.map((output) => VendorResponse.of(output.getVendor())),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }

  @ApiOperation({
    summary:
      'Replace every detail of a Vendor, its name, its city and its login phone number among them, renaming its Login to a new login phone number',
  })
  @ApiOkResponse({ type: VendorResponse })
  @PreAuthorize([Role.ADMIN])
  @Put('v1/vendors/:vendorId')
  async editVendor(
    @Param('vendorId') vendorId: string,
    @Body() request: EditVendorRequest,
  ): Promise<VendorResponse> {
    const result = await this.editVendorCommand.execute(request.toCommandInput(vendorId));

    return result.pipe(
      Either.map((output) => VendorResponse.of(output.getVendor())),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }

  @ApiOperation({
    summary:
      "Replace a Vendor's contact details, and nothing else, for the Admin or for the Vendor's own Login",
  })
  @ApiOkResponse({ type: VendorResponse })
  @PreAuthorize([Role.ADMIN, Role.VENDOR])
  @Put('v1/vendors/:vendorId/contact-details')
  async editContactDetails(
    @Param('vendorId') vendorId: string,
    @Body() request: EditContactDetailsRequest,
  ): Promise<VendorResponse> {
    const caller = this.callerResolver.getCaller();
    const result = await this.editContactDetailsCommand.execute(
      request.toCommandInput(caller.getId(), caller.getRoles(), vendorId),
    );

    return result.pipe(
      Either.map((output) => VendorResponse.of(output.getVendor())),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }

  @ApiOperation({
    summary:
      "End the sessions of a Vendor's Login, give it a new temporary password, and answer the password once",
  })
  @ApiOkResponse({ type: PasswordResetResponse })
  @PreAuthorize([Role.ADMIN])
  // It answers 200, not 201: the Vendor and its Login stay, and only the
  // Login's password is replaced.
  @HttpCode(HttpStatus.OK)
  @Post('v1/vendors/:vendorId/password-reset')
  async resetVendorPassword(
    @Param('vendorId') vendorId: string,
  ): Promise<PasswordResetResponse> {
    const result = await this.resetVendorPasswordCommand.execute(
      new ResetVendorPasswordCommandInput(vendorId),
    );

    return result.pipe(
      Either.map(PasswordResetResponse.of),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }

  @ApiOperation({
    summary:
      'Deactivate a Vendor: mark it deactivated, disable its Login and end its sessions. Doing it again finishes one that failed halfway',
  })
  @ApiOkResponse({ type: VendorResponse })
  @PreAuthorize([Role.ADMIN])
  @HttpCode(HttpStatus.OK)
  @Post('v1/vendors/:vendorId/deactivate')
  async deactivateVendor(@Param('vendorId') vendorId: string): Promise<VendorResponse> {
    const result = await this.deactivateVendorCommand.execute(
      new DeactivateVendorCommandInput(vendorId),
    );

    return result.pipe(
      Either.map((output) => VendorResponse.of(output.getVendor())),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }

  @ApiOperation({
    summary:
      'Reactivate a Vendor: enable its Login, with the password it had, and mark it active. Doing it again finishes one that failed halfway',
  })
  @ApiOkResponse({ type: VendorResponse })
  @PreAuthorize([Role.ADMIN])
  @HttpCode(HttpStatus.OK)
  @Post('v1/vendors/:vendorId/reactivate')
  async reactivateVendor(@Param('vendorId') vendorId: string): Promise<VendorResponse> {
    const result = await this.reactivateVendorCommand.execute(
      new ReactivateVendorCommandInput(vendorId),
    );

    return result.pipe(
      Either.map((output) => VendorResponse.of(output.getVendor())),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }

  @ApiOperation({ summary: 'The Vendor whose Login the caller is' })
  @ApiOkResponse({ type: VendorResponse })
  @PreAuthorize([Role.VENDOR])
  @Get('v1/caller/vendor')
  async readCallersVendor(): Promise<VendorResponse> {
    const result = await this.readCallersVendorQuery.execute(
      new ReadCallersVendorQueryInput(this.callerResolver.getCaller().getId()),
    );

    return result.pipe(
      Either.map((output) => VendorResponse.of(output.getVendor())),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }
}

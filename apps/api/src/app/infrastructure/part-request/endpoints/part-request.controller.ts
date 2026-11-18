import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { CallerResolver, ErrorStructureException, PreAuthorize, Role } from '@pcp/core';
import { Either } from 'effect';

import { FulfilPartRequestCommand } from '~/domain/part-request/FulfilPartRequestCommand';
import { ListOpenPartRequestsQuery } from '~/domain/part-request/ListOpenPartRequestsQuery';
import { ListVendorsPartRequestsQuery } from '~/domain/part-request/ListVendorsPartRequestsQuery';
import { ReadPartRequestFulfilmentQuery } from '~/domain/part-request/ReadPartRequestFulfilmentQuery';
import {
  ReadPartRequestQuery,
  ReadPartRequestQueryInput,
} from '~/domain/part-request/ReadPartRequestQuery';
import { RejectPartRequestCommand } from '~/domain/part-request/RejectPartRequestCommand';
import { SendPartRequestCommand } from '~/domain/part-request/SendPartRequestCommand';

import { FulfilledPartRequestResponse } from './FulfilledPartRequestResponse';
import { FulfilPartRequestRequest } from './FulfilPartRequestRequest';
import { ListOpenPartRequestsRequest } from './ListOpenPartRequestsRequest';
import { ListVendorsPartRequestsRequest } from './ListVendorsPartRequestsRequest';
import { OpenPartRequestsPageResponse } from './OpenPartRequestsPageResponse';
import { PartRequestFulfilmentResponse } from './PartRequestFulfilmentResponse';
import { PartRequestResponse } from './PartRequestResponse';
import { PartRequestWithVendorResponse } from './PartRequestWithVendorResponse';
import { ReadPartRequestFulfilmentRequest } from './ReadPartRequestFulfilmentRequest';
import { RejectPartRequestRequest } from './RejectPartRequestRequest';
import { SendPartRequestRequest } from './SendPartRequestRequest';
import { VendorsPartRequestsPageResponse } from './VendorsPartRequestsPageResponse';

// Part Requests: a Vendor sends them and follows them in its portal, or the
// Admin does for it, by the rule for which Vendor a request acts for; the
// Admin alone reads the queue, reads one request and resolves it.
@Controller()
export class PartRequestController {
  constructor(
    private readonly sendPartRequestCommand: SendPartRequestCommand,
    private readonly listVendorsPartRequestsQuery: ListVendorsPartRequestsQuery,
    private readonly listOpenPartRequestsQuery: ListOpenPartRequestsQuery,
    private readonly readPartRequestQuery: ReadPartRequestQuery,
    private readonly readPartRequestFulfilmentQuery: ReadPartRequestFulfilmentQuery,
    private readonly fulfilPartRequestCommand: FulfilPartRequestCommand,
    private readonly rejectPartRequestCommand: RejectPartRequestCommand,
    private readonly callerResolver: CallerResolver,
  ) {}

  @ApiOperation({
    summary:
      "Send a Part Request for a Part the catalog lacks: its Category, name and manufacturer part number, and the Offer the Vendor would make. For the Vendor's own Login, or the Admin acting for any Vendor",
  })
  @ApiCreatedResponse({ type: PartRequestResponse })
  @PreAuthorize([Role.ADMIN, Role.VENDOR])
  @Post('v1/vendors/:vendorId/part-requests')
  async sendPartRequest(
    @Param('vendorId') vendorId: string,
    @Body() request: SendPartRequestRequest,
  ): Promise<PartRequestResponse> {
    const caller = this.callerResolver.getCaller();
    const result = await this.sendPartRequestCommand.execute(
      request.toCommandInput(caller.getId(), caller.getRoles(), vendorId),
    );

    return result.pipe(
      Either.map((output) =>
        PartRequestResponse.of(output.getPartRequest(), output.getReadAt()),
      ),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }

  @ApiOperation({
    summary:
      "One page of a Vendor's Part Requests in every state, newest first, for the Vendor's own Login or the Admin",
  })
  @ApiOkResponse({ type: VendorsPartRequestsPageResponse })
  @PreAuthorize([Role.ADMIN, Role.VENDOR])
  @Get('v1/vendors/:vendorId/part-requests')
  async listVendorsPartRequests(
    @Param('vendorId') vendorId: string,
    @Query() request: ListVendorsPartRequestsRequest,
  ): Promise<VendorsPartRequestsPageResponse> {
    const caller = this.callerResolver.getCaller();
    const result = await this.listVendorsPartRequestsQuery.execute(
      request.toQueryInput(caller.getId(), caller.getRoles(), vendorId),
    );

    return result.pipe(
      Either.map((output) =>
        VendorsPartRequestsPageResponse.of(output.getPage(), output.getReadAt()),
      ),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }

  @ApiOperation({
    summary:
      'One page of the queue of open Part Requests of every Vendor, active and deactivated, oldest first, for the Admin',
  })
  @ApiOkResponse({ type: OpenPartRequestsPageResponse })
  // The Admin's only, as each endpoint below: a Vendor learns nothing about
  // other Vendors, and never resolves a request.
  @PreAuthorize([Role.ADMIN])
  @Get('v1/part-requests')
  async listOpenPartRequests(
    @Query() request: ListOpenPartRequestsRequest,
  ): Promise<OpenPartRequestsPageResponse> {
    const result = await this.listOpenPartRequestsQuery.execute(request.toQueryInput());

    return result.pipe(
      Either.map((output) =>
        OpenPartRequestsPageResponse.of(output.getPage(), output.getReadAt()),
      ),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }

  @ApiOperation({
    summary: 'One Part Request in any state, with its Vendor, for the Admin',
  })
  @ApiOkResponse({ type: PartRequestWithVendorResponse })
  @PreAuthorize([Role.ADMIN])
  @Get('v1/part-requests/:partRequestId')
  async readPartRequest(
    @Param('partRequestId') partRequestId: string,
  ): Promise<PartRequestWithVendorResponse> {
    const result = await this.readPartRequestQuery.execute(
      new ReadPartRequestQueryInput(partRequestId),
    );

    return result.pipe(
      Either.map((output) =>
        PartRequestWithVendorResponse.of(output.getPartRequest(), output.getReadAt()),
      ),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }

  @ApiOperation({
    summary:
      "What fulfilling an open Part Request with a Part would do to the Vendor's Offer for it, and whether that Offer would then be expired, without doing it, for the Admin",
  })
  @ApiOkResponse({ type: PartRequestFulfilmentResponse })
  @PreAuthorize([Role.ADMIN])
  @Get('v1/part-requests/:partRequestId/fulfilment')
  async readPartRequestFulfilment(
    @Param('partRequestId') partRequestId: string,
    @Query() request: ReadPartRequestFulfilmentRequest,
  ): Promise<PartRequestFulfilmentResponse> {
    const result = await this.readPartRequestFulfilmentQuery.execute(
      request.toQueryInput(partRequestId),
    );

    return result.pipe(
      Either.map(PartRequestFulfilmentResponse.of),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }

  @ApiOperation({
    summary:
      "Fulfil an open Part Request with a Part of any Category, which makes, replaces or keeps the Vendor's Offer for the Part, the newer statement winning, for the Admin",
  })
  @ApiOkResponse({ type: FulfilledPartRequestResponse })
  @PreAuthorize([Role.ADMIN])
  @HttpCode(HttpStatus.OK)
  @Post('v1/part-requests/:partRequestId/fulfil')
  async fulfilPartRequest(
    @Param('partRequestId') partRequestId: string,
    @Body() request: FulfilPartRequestRequest,
  ): Promise<FulfilledPartRequestResponse> {
    const caller = this.callerResolver.getCaller();
    const result = await this.fulfilPartRequestCommand.execute(
      request.toCommandInput(caller.getId(), partRequestId),
    );

    return result.pipe(
      Either.map((output) =>
        FulfilledPartRequestResponse.ofFulfilment(
          output.getPartRequest(),
          output.getOffer(),
          output.getReadAt(),
        ),
      ),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }

  @ApiOperation({
    summary: 'Reject an open Part Request with a reason, for the Admin',
  })
  @ApiOkResponse({ type: PartRequestWithVendorResponse })
  @PreAuthorize([Role.ADMIN])
  @HttpCode(HttpStatus.OK)
  @Post('v1/part-requests/:partRequestId/reject')
  async rejectPartRequest(
    @Param('partRequestId') partRequestId: string,
    @Body() request: RejectPartRequestRequest,
  ): Promise<PartRequestWithVendorResponse> {
    const result = await this.rejectPartRequestCommand.execute(
      request.toCommandInput(partRequestId),
    );

    return result.pipe(
      Either.map((output) =>
        PartRequestWithVendorResponse.of(output.getPartRequest(), output.getReadAt()),
      ),
      Either.getOrThrowWith(ErrorStructureException.of),
    );
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Public } from '@pcp/core';

import { StatusResponse } from './StatusResponse';

// Placeholder: it gives the Shopper app something to fetch that it could not
// have known by itself. Delete it when the first real Shopper endpoint arrives.
@Controller()
export class StatusController {
  // NestJS makes one controller for the life of the application, so this is
  // the time the API started.
  private readonly startedAt = new Date();

  // An empty list of requirements is how the document says that an endpoint
  // needs no login, where every other endpoint needs one.
  @ApiOperation({ summary: 'When this API process started', security: [] })
  @ApiOkResponse({ type: StatusResponse })
  @Public()
  @Get('v1/status')
  getStatus(): StatusResponse {
    return StatusResponse.of(this.startedAt);
  }
}

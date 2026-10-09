import { Controller, Get } from '@nestjs/common';
import { Public } from '@pcp/core';

import { StatusResponse } from './StatusResponse';

// Placeholder: it gives the Shopper app something to fetch that it could not
// have known by itself. Delete it when the first real Shopper endpoint arrives.
@Controller()
export class StatusController {
  // NestJS makes one controller for the life of the application, so this is
  // the time the API started.
  private readonly startedAt = new Date();

  @Public()
  @Get('v1/status')
  getStatus(): StatusResponse {
    return StatusResponse.of(this.startedAt);
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { CallerResolver, PreAuthorize, Role } from '@pcp/core';

import { CallerResponse } from './CallerResponse';

// Answers who the caller is. Nothing is decided here, so no use case stands
// behind it: the controller reads the caller and answers.
@Controller()
export class CallerController {
  constructor(private readonly callerResolver: CallerResolver) {}

  @ApiOperation({ summary: 'Who the caller is' })
  @ApiOkResponse({ type: CallerResponse })
  @PreAuthorize([Role.ADMIN, Role.VENDOR])
  @Get('v1/caller')
  getCaller(): CallerResponse {
    return CallerResponse.of(this.callerResolver.getCaller());
  }
}

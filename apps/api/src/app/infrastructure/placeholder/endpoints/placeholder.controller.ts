import { Controller, Get } from '@nestjs/common';
import { compatibilityPlaceholder } from '@pcp/compatibility';
import { corePlaceholder } from '@pcp/core';

// Placeholder: it proves that the API starts, answers a request and resolves
// its two libraries. Delete it when the first real endpoint arrives.
@Controller()
export class PlaceholderController {
  @Get()
  getPlaceholder(): { name: string; libraries: string[] } {
    return {
      name: '@pcp/api',
      libraries: [corePlaceholder, compatibilityPlaceholder],
    };
  }
}

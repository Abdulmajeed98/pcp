import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { PreAuthorize, Role } from '@pcp/core';

import { Category } from '~/domain/part/Category';
import { specificationListOf } from '~/domain/specification/specification-lists';

import { CategoryResponse } from './CategoryResponse';

// Answers the eight Categories with their specification lists, so that a
// screen builds its forms and its Part page from them rather than holding a
// copy. Nothing is decided here, so no use case stands behind it.
@Controller()
export class CategoryController {
  @ApiOperation({ summary: 'The eight Categories, each with its specification list' })
  @ApiOkResponse({ type: [CategoryResponse] })
  @PreAuthorize([Role.ADMIN, Role.VENDOR])
  @Get('v1/categories')
  readCategories(): CategoryResponse[] {
    return Category.values().map((category) =>
      CategoryResponse.of(category, specificationListOf(category)),
    );
  }
}

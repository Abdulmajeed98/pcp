import { ApiProperty } from '@nestjs/swagger';

import { Category } from '~/domain/part/Category';
import { SpecificationList } from '~/domain/specification/SpecificationList';

import { SpecificationResponse } from './SpecificationResponse';

export class CategoryResponse {
  @ApiProperty({
    description: "The Category's key, which `i18n`'s shared terms translate it by.",
    enum: Category.keys(),
    example: 'cpu',
  })
  readonly key: string;

  @ApiProperty({
    description: 'Every specification a Part of this Category can hold, in order.',
    type: [SpecificationResponse],
  })
  readonly specifications: SpecificationResponse[];

  private constructor(key: string, specifications: SpecificationResponse[]) {
    this.key = key;
    this.specifications = specifications;
  }

  static of(category: Category, specifications: SpecificationList): CategoryResponse {
    return new CategoryResponse(
      category.getKey(),
      specifications.getSpecifications().map(SpecificationResponse.of),
    );
  }
}

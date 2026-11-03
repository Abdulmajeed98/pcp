import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PagingRequest } from '@pcp/core';
import { IsIn, IsOptional, IsString } from 'class-validator';

import { type Currency, currencies } from '~/domain/currency/currency';
import { ListVisiblePartsQueryInput } from '~/domain/offer/ListVisiblePartsQuery';
import { Category } from '~/domain/part/Category';

// What a Category's list of Visible Parts asks for, from the address's query:
// the Category, the chosen currency, the search and the page. The Category
// and the currency are required, so that no page can forget to send them.
export class ListVisiblePartsRequest extends PagingRequest {
  @ApiProperty({
    description: 'The Category whose Visible Parts are listed.',
    enum: Category.keys(),
    example: 'cpu',
  })
  @IsIn(Category.keys())
  readonly category!: string;

  @ApiProperty({
    description:
      "The chosen currency, which each Part's Lowest Price is in and the Parts are ordered by.",
    enum: currencies,
    // Named, so that the generated client gives the frontends one `Currency`.
    enumName: 'Currency',
    example: 'IQD',
  })
  @IsIn(currencies)
  readonly currency!: Currency;

  @ApiPropertyOptional({
    description:
      'Words a Part must hold, in any order and any case, in its name, its manufacturer or a part number. Left out or empty, every Visible Part of the Category is found.',
    example: 'ryzen 7600',
  })
  @IsOptional()
  @IsString()
  readonly search?: string;

  toQueryInput(): ListVisiblePartsQueryInput {
    return new ListVisiblePartsQueryInput(
      // The check above lets through only the keys of the eight.
      Category.withKey(this.category) as Category,
      this.currency,
      this.search ?? '',
      this.toDomain(),
    );
  }
}

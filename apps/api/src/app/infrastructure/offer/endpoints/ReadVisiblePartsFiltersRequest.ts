import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { type Currency, currencies } from '~/domain/currency/currency';
import { ReadVisiblePartsFiltersQueryInput } from '~/domain/offer/ReadVisiblePartsFiltersQuery';
import { Category } from '~/domain/part/Category';

// What a Category's filters ask for, from the address's query: the Category
// and the chosen currency, both required, so that no page can forget to send
// them.
export class ReadVisiblePartsFiltersRequest {
  @ApiProperty({
    description: 'The Category whose filters are answered.',
    enum: Category.keys(),
    example: 'cpu',
  })
  @IsIn(Category.keys())
  readonly category!: string;

  @ApiProperty({
    description: 'The chosen currency, which the range of Lowest Prices is in.',
    enum: currencies,
    // Named, so that the generated client gives the frontends one `Currency`.
    enumName: 'Currency',
    example: 'IQD',
  })
  @IsIn(currencies)
  readonly currency!: Currency;

  toQueryInput(): ReadVisiblePartsFiltersQueryInput {
    return new ReadVisiblePartsFiltersQueryInput(
      // The check above lets through only the keys of the eight.
      Category.withKey(this.category) as Category,
      this.currency,
    );
  }
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { type Currency, currencies, currencyFacts } from '~/domain/currency/currency';
import { FilterValues, VisiblePartsFilters } from '~/domain/offer/VisiblePartsFilters';
import { Filter, type FilterKind, type FilterValue } from '~/domain/specification/filters';

import { amountTextOf } from './OfferResponse';

// One of a Category's filters, with the values its Visible Parts hold.
export class FilterResponse {
  @ApiProperty({
    description:
      "The parameter a Category's list of Visible Parts is narrowed by it with, repeated for several values.",
    example: 'socket',
  })
  readonly parameter: string;

  @ApiProperty({
    description: 'The kind of value it offers: a whole number, text, or yes or no.',
    enum: Filter.kinds(),
    // Named, so that the generated client gives the Shopper app one type.
    enumName: 'FilterKind',
    example: 'text',
  })
  readonly kind: FilterKind;

  @ApiPropertyOptional({ description: 'The unit of a number.', example: 'GB' })
  readonly unit?: string;

  @ApiProperty({
    description:
      'The distinct values the Visible Parts hold, numbers by size and text alphabetically, as a Part\'s specifications hold them: never one that stands for "not known".',
    type: 'array',
    items: { oneOf: [{ type: 'number' }, { type: 'string' }, { type: 'boolean' }] },
    example: ['AM4', 'AM5'],
  })
  readonly values: FilterValue[];

  private constructor(filterValues: FilterValues) {
    const filter = filterValues.getFilter();
    this.parameter = filter.getParameter();
    this.kind = filter.getKind();
    const unit = filter.getSpecification().getUnit();
    if (unit !== undefined) this.unit = unit;
    this.values = [...filterValues.getValues()];
  }

  static of(filterValues: FilterValues): FilterResponse {
    return new FilterResponse(filterValues);
  }
}

// The range of a Category's Lowest Prices in the chosen currency.
export class PriceRangeResponse {
  @ApiProperty({
    description: 'The chosen currency.',
    enum: currencies,
    enumName: 'Currency',
    example: 'IQD',
  })
  readonly currency: Currency;

  @ApiProperty({
    description:
      "The lowest of the Visible Parts' Lowest Prices, as decimal text, as a Lowest Price's amount is. Null when none has a Lowest Price.",
    type: String,
    nullable: true,
    example: '410000',
  })
  readonly lowest: string | null;

  @ApiProperty({
    description:
      "The highest of the Visible Parts' Lowest Prices, as decimal text. Null when none has a Lowest Price.",
    type: String,
    nullable: true,
    example: '1250000',
  })
  readonly highest: string | null;

  private constructor(filters: VisiblePartsFilters) {
    this.currency = filters.getCurrency();
    const unitsInOne = currencyFacts[this.currency].unitsInOne;
    const textOf = (amount: number | null) =>
      amount === null ? null : amountTextOf(amount, unitsInOne);
    this.lowest = textOf(filters.getLowestPrice());
    this.highest = textOf(filters.getHighestPrice());
  }

  static of(filters: VisiblePartsFilters): PriceRangeResponse {
    return new PriceRangeResponse(filters);
  }
}

// What a Category's list of Visible Parts can be narrowed by, read from all
// its Visible Parts before any filter or search is applied (BRW-2).
export class VisiblePartsFiltersResponse {
  @ApiProperty({
    description: "The Visible Parts' manufacturers, alphabetically.",
    type: [String],
    example: ['AMD', 'Intel'],
  })
  readonly manufacturers: string[];

  @ApiProperty({
    description:
      "The Category's filters that some Visible Part holds a value of, in the order a form shows them, each with its values.",
    type: [FilterResponse],
  })
  readonly filters: FilterResponse[];

  @ApiProperty({
    description: "The range of the Visible Parts' Lowest Prices.",
    type: PriceRangeResponse,
  })
  readonly priceRange: PriceRangeResponse;

  private constructor(filters: VisiblePartsFilters) {
    this.manufacturers = [...filters.getManufacturers()];
    this.filters = filters.getFilters().map(FilterResponse.of);
    this.priceRange = PriceRangeResponse.of(filters);
  }

  static of(filters: VisiblePartsFilters): VisiblePartsFiltersResponse {
    return new VisiblePartsFiltersResponse(filters);
  }
}

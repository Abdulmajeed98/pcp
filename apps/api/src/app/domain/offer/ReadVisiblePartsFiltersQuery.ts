import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { Currency } from '../currency/currency';
import { Category } from '../part/Category';
import { ReadVisiblePartsFiltersParams, VisiblePartStore } from './VisiblePartStore';
import { VisiblePartsFilters } from './VisiblePartsFilters';

class Input {
  constructor(
    private readonly category: Category,
    private readonly currency: Currency,
    private readonly inStockOnly: boolean,
  ) {}

  getCategory(): Category {
    return this.category;
  }

  // The chosen currency, which the range of Lowest Prices is in.
  getCurrency(): Currency {
    return this.currency;
  }

  // Whether only the Visible Parts with an in-stock Visible Offer give the
  // values, as the picker asks (BLD-2).
  isInStockOnly(): boolean {
    return this.inStockOnly;
  }
}

class Output {
  private constructor(private readonly filters: VisiblePartsFilters) {}

  static of(filters: VisiblePartsFilters): Output {
    return new Output(filters);
  }

  getFilters(): VisiblePartsFilters {
    return this.filters;
  }
}

export { Input as ReadVisiblePartsFiltersQueryInput };
export { Output as ReadVisiblePartsFiltersQueryOutput };

// A Category's filters, for anyone, with no Login (BRW-2): its manufacturers,
// each of its filters with the values its Visible Parts hold, and the range
// of their Lowest Prices in the chosen currency, all read from its Visible
// Parts before any filter or search is applied; for the picker, from those
// with an in-stock Visible Offer alone (BLD-2), so that its choices are the
// values of the Parts it lists, and never shift as choices are made.
@Injectable()
export class ReadVisiblePartsFiltersQuery {
  constructor(private readonly visiblePartStore: VisiblePartStore) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    // Read once, so that every Offer's visibility is judged at one moment.
    const now = new Date();
    const filters = await this.visiblePartStore.readVisiblePartsFilters(
      new ReadVisiblePartsFiltersParams(
        input.getCategory(),
        input.getCurrency(),
        input.isInStockOnly(),
        now,
      ),
    );

    return Either.map(filters, Output.of);
  }
}

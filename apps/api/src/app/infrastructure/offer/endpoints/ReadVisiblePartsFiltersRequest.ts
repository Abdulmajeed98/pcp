import { type Currency } from '~/domain/currency/currency';
import { ReadVisiblePartsFiltersQueryInput } from '~/domain/offer/ReadVisiblePartsFiltersQuery';

import {
  CategoryAsked,
  ChosenCurrencyAsked,
  theCategoryAsked,
} from './category-and-currency';

// What a Category's filters ask for, from the address's query: the Category
// and the chosen currency, both required, so that no page can forget to send
// them.
export class ReadVisiblePartsFiltersRequest {
  @CategoryAsked('The Category whose filters are answered.')
  readonly category!: string;

  @ChosenCurrencyAsked('The chosen currency, which the range of Lowest Prices is in.')
  readonly currency!: Currency;

  toQueryInput(): ReadVisiblePartsFiltersQueryInput {
    return new ReadVisiblePartsFiltersQueryInput(
      theCategoryAsked(this.category),
      this.currency,
    );
  }
}

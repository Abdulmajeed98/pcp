import { type Currency } from '~/domain/currency/currency';
import { ReadVisiblePartsFiltersQueryInput } from '~/domain/offer/ReadVisiblePartsFiltersQuery';

import {
  CategoryAsked,
  ChosenCurrencyAsked,
  theCategoryAsked,
} from './category-and-currency';
import { isOn, SwitchAsked } from './switch-asked';

// What a Category's filters ask for, from the address's query: the Category
// and the chosen currency, both required, so that no page can forget to send
// them, and whether only the Parts in stock give their values, as the picker
// asks.
export class ReadVisiblePartsFiltersRequest {
  @CategoryAsked('The Category whose filters are answered.')
  readonly category!: string;

  @ChosenCurrencyAsked('The chosen currency, which the range of Lowest Prices is in.')
  readonly currency!: Currency;

  @SwitchAsked(
    "In stock only, as the picker asks for a Category's filters (BLD-2): on, every value is read from the Visible Parts with at least one in-stock Visible Offer alone.",
  )
  readonly inStockOnly?: string;

  toQueryInput(): ReadVisiblePartsFiltersQueryInput {
    return new ReadVisiblePartsFiltersQueryInput(
      theCategoryAsked(this.category),
      this.currency,
      isOn(this.inStockOnly),
    );
  }
}

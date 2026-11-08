import { type Currency } from '~/domain/currency/currency';
import { ReadBuildQueryInput } from '~/domain/build/ReadBuildQuery';
import { ChosenCurrencyAsked } from '~/infrastructure/offer/endpoints/category-and-currency';

import { BuildAsked } from './build-asked';

// What reading a Build asks for, from the address's query: the chosen
// currency and the Build.
export class ReadBuildRequest {
  @ChosenCurrencyAsked(
    "The chosen currency, which each Part's Lowest Price, each Vendor's Shown Prices and every total are in, and the Vendors are ordered by.",
  )
  readonly currency!: Currency;

  @BuildAsked('The Build that is read.')
  readonly part?: string[];

  toQueryInput(): ReadBuildQueryInput {
    return new ReadBuildQueryInput(this.part ?? [], this.currency);
  }
}

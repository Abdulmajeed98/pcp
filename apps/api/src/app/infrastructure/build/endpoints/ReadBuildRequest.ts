import { type Currency } from '~/domain/currency/currency';
import { ReadBuildQueryInput } from '~/domain/build/ReadBuildQuery';
import { ChosenCurrencyAsked } from '~/infrastructure/offer/endpoints/category-and-currency';

import { BuildAsked } from './build-asked';

// What reading a Build asks for, from the address's query: the chosen
// currency and the Build.
export class ReadBuildRequest {
  @ChosenCurrencyAsked(
    'The chosen currency, required as every public read of prices requires it, so that no page can forget to send it.',
  )
  readonly currency!: Currency;

  @BuildAsked('The Build that is read. Left out, the Build is empty.')
  readonly part?: string[];

  toQueryInput(): ReadBuildQueryInput {
    return new ReadBuildQueryInput(this.part ?? []);
  }
}

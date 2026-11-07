import { ListVisibleOffersOfPartQueryInput } from '~/domain/offer/ListVisibleOffersOfPartQuery';
import { type Currency } from '~/domain/currency/currency';

import { ChosenCurrencyAsked } from './category-and-currency';

// What a read of a Part's visible Offers asks for, from the address's query:
// the currency every Shown Price is in. It is required, so that no page can
// forget to send the Shopper's choice.
export class ListVisibleOffersOfPartRequest {
  @ChosenCurrencyAsked(
    "The chosen currency, which each Offer's Shown Price is in and the Offers are ordered by.",
  )
  readonly currency!: Currency;

  toQueryInput(partId: string): ListVisibleOffersOfPartQueryInput {
    return new ListVisibleOffersOfPartQueryInput(partId, this.currency);
  }
}

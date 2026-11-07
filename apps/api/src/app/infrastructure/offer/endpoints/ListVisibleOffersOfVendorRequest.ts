import { PagingRequest } from '@pcp/core';

import { type Currency } from '~/domain/currency/currency';
import { ListVisibleOffersOfVendorQueryInput } from '~/domain/offer/ListVisibleOffersOfVendorQuery';

import { ChosenCurrencyAsked } from './category-and-currency';

// What a visible Vendor's list of its Offers asks for, from the address's
// query: the currency every Shown Price is in, and the page. The currency is
// required, so that no page can forget to send the Shopper's choice.
export class ListVisibleOffersOfVendorRequest extends PagingRequest {
  @ChosenCurrencyAsked(
    "The chosen currency, which each Offer's Shown Price is in and the Offers of each Category are ordered by.",
  )
  readonly currency!: Currency;

  toQueryInput(vendorId: string): ListVisibleOffersOfVendorQueryInput {
    return new ListVisibleOffersOfVendorQueryInput(
      vendorId,
      this.currency,
      this.toDomain(),
    );
  }
}

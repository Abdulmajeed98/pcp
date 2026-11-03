import { PageAttributes } from '@pcp/core';

import { VisibleOffer } from './VisibleOffer';

// One page of an active Vendor's visible Offers, each with its Part, and where
// the page stands among them all.
export class VisibleOffersOfVendorPage {
  constructor(
    private readonly offers: readonly VisibleOffer[],
    private readonly page: PageAttributes,
  ) {}

  getOffers(): readonly VisibleOffer[] {
    return this.offers;
  }

  getPageAttributes(): PageAttributes {
    return this.page;
  }
}

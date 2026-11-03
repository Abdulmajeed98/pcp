import { Offer } from './Offer';
import { ShownPrice } from './shown-price';

// A visible Offer, as Shoppers see it: the Offer, the name of its Vendor,
// which is active, and its Shown Price in the chosen currency. It holds
// nothing else of the Vendor, so that no Login identifier or login phone
// number can reach a Shopper.
export class VisibleOffer {
  constructor(
    private readonly offer: Offer,
    private readonly vendorName: string,
    private readonly shownPrice: ShownPrice | null,
  ) {}

  getOffer(): Offer {
    return this.offer;
  }

  // As the Vendor writes it.
  getVendorName(): string {
    return this.vendorName;
  }

  // None only when the Offer has no Quoted Price in the chosen currency and
  // there is no Platform Rate to convert the other by.
  getShownPrice(): ShownPrice | null {
    return this.shownPrice;
  }
}

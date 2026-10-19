import { Offer } from './Offer';

// A visible Offer, as Shoppers see it: the Offer, and the name of its Vendor,
// which is active. It holds nothing else of the Vendor, so that no Login
// identifier or login phone number can reach a Shopper.
export class VisibleOffer {
  constructor(
    private readonly offer: Offer,
    private readonly vendorName: string,
  ) {}

  getOffer(): Offer {
    return this.offer;
  }

  // As the Vendor writes it.
  getVendorName(): string {
    return this.vendorName;
  }
}

import { PhoneNumber } from '../phone-number/PhoneNumber';
import { VendorsOfferCounts } from './OfferStore';

// An active Vendor that has at least one Expired Offer or Offer about to
// expire, as the Admin's list of whom to remind shows it (OFF-9): who it is,
// the numbers to call and to message it on, and its counts of Offers.
export class VendorWithExpiringOffers {
  constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly phoneNumber: PhoneNumber,
    private readonly whatsAppNumber: PhoneNumber | null,
    private readonly counts: VendorsOfferCounts,
  ) {}

  getId(): string {
    return this.id;
  }

  // As the Vendor writes it.
  getName(): string {
    return this.name;
  }

  getPhoneNumber(): PhoneNumber {
    return this.phoneNumber;
  }

  // Null when the Vendor has none.
  getWhatsAppNumber(): PhoneNumber | null {
    return this.whatsAppNumber;
  }

  // Of all the Vendor's Offers, judged at the moment the list was read.
  getCounts(): VendorsOfferCounts {
    return this.counts;
  }
}

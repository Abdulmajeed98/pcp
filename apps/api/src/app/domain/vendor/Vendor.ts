import { PhoneNumber } from '../phone-number/PhoneNumber';
import { City } from './City';

// A business that sells Parts to the public from one location and has
// agreed to show its Offers on the platform. Its Login is kept in the
// identity service, and the Vendor holds that Login's identifier.
export class Vendor {
  constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly city: City,
    private readonly loginPhoneNumber: PhoneNumber,
    private readonly loginId: string,
    private readonly active: boolean,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  getId(): string {
    return this.id;
  }

  // As the Vendor writes it.
  getName(): string {
    return this.name;
  }

  getCity(): City {
    return this.city;
  }

  // The phone number the Vendor's Login is known by and logged in with,
  // which is also that Login's name.
  getLoginPhoneNumber(): PhoneNumber {
    return this.loginPhoneNumber;
  }

  // The identifier of the Vendor's own Login, which is a token's subject and
  // a Caller's identifier.
  getLoginId(): string {
    return this.loginId;
  }

  // Whether the Vendor is active, or a deactivated Vendor.
  isActive(): boolean {
    return this.active;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}

import { CreateVendorCommandInput } from '~/domain/vendor/CreateVendorCommand';

import { VendorDetailsRequest } from './VendorDetailsRequest';

// Every detail of a new Vendor.
export class CreateVendorRequest extends VendorDetailsRequest {
  toCommandInput(): CreateVendorCommandInput {
    return new CreateVendorCommandInput(this.toUncheckedVendorDetails());
  }
}

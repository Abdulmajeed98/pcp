import { EditVendorCommandInput } from '~/domain/vendor/EditVendorCommand';

import { VendorDetailsRequest } from './VendorDetailsRequest';

// Every detail of a Vendor, which replace those it has, so that a detail it
// may leave out and that is left out is cleared.
export class EditVendorRequest extends VendorDetailsRequest {
  toCommandInput(vendorId: string): EditVendorCommandInput {
    return new EditVendorCommandInput(vendorId, this.toUncheckedVendorDetails());
  }
}

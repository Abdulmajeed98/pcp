import { Role } from '@pcp/core';

import { EditContactDetailsCommandInput } from '~/domain/vendor/EditContactDetailsCommand';

import { ContactDetailsRequest } from './ContactDetailsRequest';

// A Vendor's contact details, which replace those it has, so that a detail it
// may leave out and that is left out is cleared. It declares nothing else: a
// name, a city or a login phone number sent with it is refused, as every
// field a Request does not declare is, so that a Vendor cannot change them
// (ACC-8).
export class EditContactDetailsRequest extends ContactDetailsRequest {
  toCommandInput(
    callerId: string,
    callerRoles: readonly Role[],
    vendorId: string,
  ): EditContactDetailsCommandInput {
    return new EditContactDetailsCommandInput(
      callerId,
      callerRoles,
      vendorId,
      this.toUncheckedContactDetails(),
    );
  }
}

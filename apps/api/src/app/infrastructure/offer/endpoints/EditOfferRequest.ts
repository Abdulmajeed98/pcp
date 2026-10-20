import { Role } from '@pcp/core';

import { EditOfferCommandInput } from '~/domain/offer/EditOfferCommand';

import { OfferDetailsRequest } from './OfferDetailsRequest';

// An Offer's new details, which replace all it had: a detail left out is
// cleared. Its Part is not among them, and a request that names one is
// refused, since an Offer stays the Offer for its Part.
export class EditOfferRequest extends OfferDetailsRequest {
  toCommandInput(
    callerId: string,
    callerRoles: readonly Role[],
    vendorId: string,
    offerId: string,
  ): EditOfferCommandInput {
    return new EditOfferCommandInput(
      callerId,
      callerRoles,
      vendorId,
      offerId,
      this.uncheckedDetails(),
    );
  }
}

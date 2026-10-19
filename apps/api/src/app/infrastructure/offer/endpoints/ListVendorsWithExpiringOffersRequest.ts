import { PagingRequest } from '@pcp/core';

import { ListVendorsWithExpiringOffersQueryInput } from '~/domain/offer/ListVendorsWithExpiringOffersQuery';

// The page of the Vendors to remind asked for, from the address's query.
export class ListVendorsWithExpiringOffersRequest extends PagingRequest {
  toQueryInput(): ListVendorsWithExpiringOffersQueryInput {
    return new ListVendorsWithExpiringOffersQueryInput(this.toDomain());
  }
}

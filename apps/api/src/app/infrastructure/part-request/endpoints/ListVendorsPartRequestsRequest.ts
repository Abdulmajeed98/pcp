import { PagingRequest, Role } from '@pcp/core';

import { ListVendorsPartRequestsQueryInput } from '~/domain/part-request/ListVendorsPartRequestsQuery';

// The page of a Vendor's Part Requests asked for, from the address's query.
export class ListVendorsPartRequestsRequest extends PagingRequest {
  toQueryInput(
    callerId: string,
    callerRoles: readonly Role[],
    vendorId: string,
  ): ListVendorsPartRequestsQueryInput {
    return new ListVendorsPartRequestsQueryInput(
      callerId,
      callerRoles,
      vendorId,
      this.toDomain(),
    );
  }
}

import { PagingRequest } from '@pcp/core';

import { ListPartsMissingSpecificationsQueryInput } from '~/domain/part/ListPartsMissingSpecificationsQuery';

// The page of the Parts missing specifications asked for, from the address's
// query.
export class ListPartsMissingSpecificationsRequest extends PagingRequest {
  toQueryInput(): ListPartsMissingSpecificationsQueryInput {
    return new ListPartsMissingSpecificationsQueryInput(this.toDomain());
  }
}

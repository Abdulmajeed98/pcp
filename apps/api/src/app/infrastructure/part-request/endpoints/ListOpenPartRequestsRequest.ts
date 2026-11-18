import { PagingRequest } from '@pcp/core';

import { ListOpenPartRequestsQueryInput } from '~/domain/part-request/ListOpenPartRequestsQuery';

// The page of the Admin's queue of open Part Requests asked for, from the
// address's query.
export class ListOpenPartRequestsRequest extends PagingRequest {
  toQueryInput(): ListOpenPartRequestsQueryInput {
    return new ListOpenPartRequestsQueryInput(this.toDomain());
  }
}

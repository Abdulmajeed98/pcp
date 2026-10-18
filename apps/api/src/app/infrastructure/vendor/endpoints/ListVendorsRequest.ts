import { PagingRequest } from '@pcp/core';

import { ListVendorsQueryInput } from '~/domain/vendor/ListVendorsQuery';

// The page of the Vendors asked for, from the address's query.
export class ListVendorsRequest extends PagingRequest {
  toQueryInput(): ListVendorsQueryInput {
    return new ListVendorsQueryInput(this.toDomain());
  }
}

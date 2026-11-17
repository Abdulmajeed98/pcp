import { PagingRequest } from '@pcp/core';

import { ListReferralCountsQueryInput } from '~/domain/referral/ListReferralCountsQuery';

// The page of the Referral counts asked for, from the address's query.
export class ListReferralCountsRequest extends PagingRequest {
  toQueryInput(): ListReferralCountsQueryInput {
    return new ListReferralCountsQueryInput(this.toDomain());
  }
}

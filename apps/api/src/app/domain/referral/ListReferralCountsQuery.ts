import { Injectable } from '@nestjs/common';
import { PageableAttributes, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { ReferralCountsPage, ReferralStore } from './ReferralStore';

class Input {
  constructor(private readonly pageable: PageableAttributes) {}

  getPageable(): PageableAttributes {
    return this.pageable;
  }
}

class Output {
  private constructor(private readonly page: ReferralCountsPage) {}

  static of(page: ReferralCountsPage): Output {
    return new Output(page);
  }

  getCountsPage(): ReferralCountsPage {
    return this.page;
  }
}

export { Input as ListReferralCountsQueryInput };
export { Output as ListReferralCountsQueryOutput };

// The Admin lists every Vendor's Referral count, a page at a time, the most
// Referrals first, so that the Admin can show a Vendor what the platform
// brings it (SHR-7). Every Vendor is on it, deactivated ones and those with
// none among them.
@Injectable()
export class ListReferralCountsQuery {
  constructor(private readonly referralStore: ReferralStore) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const page = await this.referralStore.listCounts(input.getPageable());

    return Either.map(page, Output.of);
  }
}

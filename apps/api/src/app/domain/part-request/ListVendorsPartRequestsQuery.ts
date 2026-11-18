import { Injectable } from '@nestjs/common';
import { PageableAttributes, Role, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { VendorAccessRule } from '../vendor/VendorAccessRule';
import { PartRequestsPage, PartRequestStore } from './PartRequestStore';

class Input {
  constructor(
    private readonly callerId: string,
    private readonly callerRoles: readonly Role[],
    private readonly vendorId: string,
    private readonly pageable: PageableAttributes,
  ) {}

  // The identifier of the Login the request was made with.
  getCallerId(): string {
    return this.callerId;
  }

  getCallerRoles(): readonly Role[] {
    return this.callerRoles;
  }

  getVendorId(): string {
    return this.vendorId;
  }

  getPageable(): PageableAttributes {
    return this.pageable;
  }
}

class Output {
  private constructor(
    private readonly page: PartRequestsPage,
    private readonly readAt: Date,
  ) {}

  static of(page: PartRequestsPage, readAt: Date): Output {
    return new Output(page, readAt);
  }

  getPage(): PartRequestsPage {
    return this.page;
  }

  // Now, by the API's clock, when the list was read: every request's days
  // since it was sent, and whether its Offer would be expired, are judged
  // at it.
  getReadAt(): Date {
    return this.readAt;
  }
}

export { Input as ListVendorsPartRequestsQueryInput };
export { Output as ListVendorsPartRequestsQueryOutput };

// A Vendor lists its own Part Requests in every state, a page at a time,
// newest first, to see where each stands (REQ-4); or the Admin lists any
// Vendor's, acting as it, by the rule for which Vendor a request acts for.
// No other Vendor sees them.
@Injectable()
export class ListVendorsPartRequestsQuery {
  constructor(
    private readonly vendorAccessRule: VendorAccessRule,
    private readonly partRequestStore: PartRequestStore,
  ) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const actedFor = await this.vendorAccessRule.vendorActedFor(
      input.getCallerId(),
      input.getCallerRoles(),
      input.getVendorId(),
    );
    if (Either.isLeft(actedFor)) return Either.left(actedFor.left);

    // The clock is read once, so that every request on the page is judged at
    // the same moment.
    const now = new Date();
    const page = await this.partRequestStore.listByVendor(
      actedFor.right.getId(),
      input.getPageable(),
    );

    return Either.map(page, (found) => Output.of(found, now));
  }
}

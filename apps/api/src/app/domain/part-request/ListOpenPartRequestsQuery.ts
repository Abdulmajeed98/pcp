import { Injectable } from '@nestjs/common';
import { PageableAttributes, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { PartRequestsPage, PartRequestStore } from './PartRequestStore';

class Input {
  constructor(private readonly pageable: PageableAttributes) {}

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

  // Now, by the API's clock, when the queue was read: every request's days
  // waiting, and whether its Offer would be expired, are judged at it.
  getReadAt(): Date {
    return this.readAt;
  }
}

export { Input as ListOpenPartRequestsQueryInput };
export { Output as ListOpenPartRequestsQueryOutput };

// The Admin lists the queue of open Part Requests of every Vendor, active
// and deactivated, a page at a time, oldest first, to deal with them in the
// order they came (REQ-2). A fulfilled or rejected request has left it.
@Injectable()
export class ListOpenPartRequestsQuery {
  constructor(private readonly partRequestStore: PartRequestStore) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    // The clock is read once, so that every request on the page is judged at
    // the same moment.
    const now = new Date();
    const page = await this.partRequestStore.listOpen(input.getPageable());

    return Either.map(page, (found) => Output.of(found, now));
  }
}

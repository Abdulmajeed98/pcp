import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { existingPartRequest } from './existing-part-request';
import { partRequestResolved } from './part-request-errors';
import { PartRequestAndOffer } from './PartRequest';
import { PartRequestStore, RejectPartRequestParams } from './PartRequestStore';
import { checkedRejectionReason } from './rejection-reason';

class Input {
  constructor(
    private readonly partRequestId: string,
    private readonly reason: string | null,
  ) {}

  getPartRequestId(): string {
    return this.partRequestId;
  }

  // As the Admin wrote it, or null when none was given.
  getReason(): string | null {
    return this.reason;
  }
}

class Output {
  private constructor(
    private readonly partRequest: PartRequestAndOffer,
    private readonly rejectedAt: Date,
  ) {}

  static of(partRequest: PartRequestAndOffer, rejectedAt: Date): Output {
    return new Output(partRequest, rejectedAt);
  }

  // The request, rejected, with no Offer.
  getPartRequest(): PartRequestAndOffer {
    return this.partRequest;
  }

  // Now, by the API's clock, when it was rejected.
  getReadAt(): Date {
    return this.rejectedAt;
  }
}

export { Input as RejectPartRequestCommandInput };
export { Output as RejectPartRequestCommandOutput };

// The Admin rejects a Part Request with a reason, which the Vendor reads as
// the Admin wrote it (REQ-2). No Offer is made. A request is resolved once
// only, and a rejected one is never reopened: the Vendor sends a corrected
// one instead.
@Injectable()
export class RejectPartRequestCommand {
  constructor(private readonly partRequestStore: PartRequestStore) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    // In the order of the refusals: the request, whether it is still open,
    // then the reason. The Store asks again whether it is open, holding its
    // row, so that two calls at once resolve it once.
    const id = input.getPartRequestId();
    const partRequest = existingPartRequest(id, await this.partRequestStore.readById(id));
    if (Either.isLeft(partRequest)) return Either.left(partRequest.left);
    if (!partRequest.right.isOpen()) return Either.left(partRequestResolved(id));

    const reason = checkedRejectionReason(input.getReason());
    if (Either.isLeft(reason)) return Either.left(reason.left);

    // The API's clock, never the database's, gives the moment it is
    // rejected.
    const now = new Date();
    const rejected = await this.partRequestStore.reject(
      new RejectPartRequestParams(id, reason.right, now),
    );
    if (Either.isLeft(rejected)) return Either.left(rejected.left);

    // Read again, as every read is.
    const read = existingPartRequest(id, await this.partRequestStore.readById(id));
    return Either.map(read, (found) =>
      Output.of(new PartRequestAndOffer(found, null), now),
    );
  }
}

import { Injectable, Logger } from '@nestjs/common';
import {
  databaseErrorOf,
  PageableAttributes,
  PageAttributes,
  ServerError,
  StructuredError,
} from '@pcp/core';
import { and, asc, count, desc, eq, SQL } from 'drizzle-orm';
import { Either, Option } from 'effect';

import { OfferDetails } from '~/domain/offer/OfferDetails';
import { Category } from '~/domain/part/Category';
import { OfferFulfilment, offerFulfilmentOf } from '~/domain/part-request/offer-fulfilment';
import {
  partRequestNotFound,
  partRequestResolved,
} from '~/domain/part-request/part-request-errors';
import {
  PartRequest,
  PartRequestAndOffer,
  PartRequestResolution,
  PartRequestState,
  SendingVendor,
} from '~/domain/part-request/PartRequest';
import {
  FulfilPartRequestParams,
  PartRequestsPage,
  PartRequestStore,
  RejectPartRequestParams,
  SendPartRequestParams,
} from '~/domain/part-request/PartRequestStore';
import { DatabaseProvider } from '~/infrastructure/database/DatabaseProvider';
import { couldBeIdentifier } from '~/infrastructure/database/identifiers';
import { Transaction } from '~/infrastructure/database/transaction';
import { offer } from '~/infrastructure/offer/offer.schema';
import {
  holdTheOffer,
  OfferWriting,
  replaceTheDetailsOf,
  writeANewOfferUnlessOneIsThere,
} from '~/infrastructure/offer/offer-writing';
import { part, PartRow } from '~/infrastructure/part/part.schema';
import { partOf } from '~/infrastructure/part/part-of-row';
import { partPhoto } from '~/infrastructure/photo/photo.schema';
import { vendor } from '~/infrastructure/vendor/vendor.schema';

import { partRequest, PartRequestRow } from '../part-request.schema';

// A Part Request's row as a read gives it: with its Vendor, and, when it was
// fulfilled, its Part with its photo's identifier and the Vendor's Offer for
// that Part now, if it still has one.
const partRequestWithAll = {
  partRequest,
  vendorName: vendor.name,
  vendorActive: vendor.active,
  part,
  photoId: partPhoto.id,
  offerId: offer.id,
};

type ReadRow = {
  partRequest: PartRequestRow;
  vendorName: string;
  vendorActive: boolean;
  part: PartRow | null;
  photoId: string | null;
  offerId: string | null;
};

// How a row's resolution reads: what its state holds. The database's checks
// tie each state to what it must hold, so a row that breaks them means the
// two have drifted apart.
function resolutionOf(row: ReadRow): Either.Either<PartRequestResolution, StructuredError> {
  const { state, reason, resolvedAt } = row.partRequest;
  if (state === 'open') return Either.right({ state });
  if (state === 'fulfilled' && row.part !== null && resolvedAt !== null) {
    return Either.map(partOf(row.part, row.photoId), (found) => ({
      state,
      part: found,
      resolvedAt,
    }));
  }
  if (state === 'rejected' && reason !== null && resolvedAt !== null) {
    return Either.right({ state, reason, resolvedAt });
  }

  return Either.left(
    ServerError.of(`A Part Request holds what its state does not: ${row.partRequest.id}`),
  );
}

// A row as a Part Request. The database's list of Categories is made from
// the domain's, so a Category the domain does not know means the two have
// drifted apart.
function toDomain(row: ReadRow): Either.Either<PartRequest, StructuredError> {
  const kept = row.partRequest;
  const category = Category.withKey(kept.category);
  if (category === undefined) {
    return Either.left(
      ServerError.of(
        `A Part Request has a Category the API does not know: ${kept.category}`,
      ),
    );
  }

  return Either.map(
    resolutionOf(row),
    (resolution) =>
      new PartRequest(
        kept.id,
        new SendingVendor(kept.vendorId, row.vendorName, row.vendorActive),
        category,
        kept.name,
        kept.partNumber,
        OfferDetails.asKept(
          kept.usdPriceCents,
          kept.iqdPrice,
          kept.inStock,
          kept.warrantyMonths,
        ),
        kept.sentAt,
        resolution,
      ),
  );
}

// The same, with the Vendor's Offer for its Part now, which the row's own
// join found, as every read answers it.
function toDomainWithOffer(
  row: ReadRow,
): Either.Either<PartRequestAndOffer, StructuredError> {
  return Either.map(toDomain(row), (found) => new PartRequestAndOffer(found, row.offerId));
}

// What a resolution reads of the Part Request it holds: the Vendor, the
// state, the moment it was sent, and the Offer it would make.
type HeldPartRequest = {
  readonly vendorId: string;
  readonly state: PartRequestState;
  readonly sentAt: Date;
  readonly details: OfferDetails;
};

// The Part Request's row, held until the transaction ends, so that a second
// resolution waits for this one and then finds it resolved; or none.
async function holdThePartRequest(
  transaction: Transaction,
  partRequestId: string,
): Promise<HeldPartRequest | undefined> {
  const [held] = await transaction
    .select({
      vendorId: partRequest.vendorId,
      state: partRequest.state,
      sentAt: partRequest.sentAt,
      usdPriceCents: partRequest.usdPriceCents,
      iqdPrice: partRequest.iqdPrice,
      inStock: partRequest.inStock,
      warrantyMonths: partRequest.warrantyMonths,
    })
    .from(partRequest)
    .where(eq(partRequest.id, partRequestId))
    .for('update');
  if (held === undefined) return undefined;

  return {
    vendorId: held.vendorId,
    state: held.state,
    sentAt: held.sentAt,
    details: OfferDetails.asKept(
      held.usdPriceCents,
      held.iqdPrice,
      held.inStock,
      held.warrantyMonths,
    ),
  };
}

// What fulfilling the request with the Part does to the Vendor's Offer for
// it, by the rule in `offer-fulfilment.ts`, written through the Offer
// module's own writing in the transaction handed: made when the Vendor has
// none, replaced when it was confirmed before the request was sent, kept
// otherwise; or none, when the Vendor's Offer came and went while this
// looked. The Vendor's Offer is held, so that the Vendor's own change made
// at the same time waits and is judged after this one. The Vendor's own add
// can still arrive between this reading, which found none, and this
// writing: the database's unique pair then finds it, and it is held as it
// now stands and judged by the same rule, confirmed after the request was
// sent, and so kept, the Vendor's later word (the code review's Spec
// finding 3).
async function theOfferFulfilled(
  transaction: Transaction,
  held: HeldPartRequest,
  partId: string,
  writing: OfferWriting,
): Promise<OfferFulfilment | undefined> {
  const theVendorsOffer = and(eq(offer.vendorId, held.vendorId), eq(offer.partId, partId));
  let before = await holdTheOffer(transaction, theVendorsOffer);
  if (before === undefined) {
    const made = await writeANewOfferUnlessOneIsThere(
      transaction,
      held.vendorId,
      partId,
      writing,
    );
    if (made !== undefined) return 'created';
    before = await holdTheOffer(transaction, theVendorsOffer);
    if (before === undefined) return undefined;
  }

  const fulfilment = offerFulfilmentOf(before.confirmedAt, held.sentAt);
  if (fulfilment === 'replaced') await replaceTheDetailsOf(transaction, before, writing);
  return fulfilment;
}

@Injectable()
export class DatabasePartRequestStore implements PartRequestStore {
  private readonly logger = new Logger(DatabasePartRequestStore.name);

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async send(
    params: SendPartRequestParams,
  ): Promise<Either.Either<PartRequest, StructuredError>> {
    const details = params.getDetails();
    const offerDetails = details.getOfferDetails();

    let partRequestId: string;
    try {
      const [row] = await this.databaseProvider
        .getClient()
        .insert(partRequest)
        .values({
          vendorId: params.getVendorId(),
          category: details.getCategory().getKey(),
          name: details.getName(),
          partNumber: details.getPartNumber(),
          usdPriceCents: offerDetails.getUsdPriceCents(),
          iqdPrice: offerDetails.getIqdPrice(),
          inStock: offerDetails.isInStock(),
          warrantyMonths: offerDetails.getWarrantyMonths(),
          sentAt: params.getSentAt(),
          state: 'open',
        })
        .returning({ id: partRequest.id });
      partRequestId = row.id;
    } catch (error) {
      this.logger.error(error, 'A Part Request could not be kept');
      return Either.left(databaseErrorOf(error, 'A Part Request could not be kept'));
    }

    // Read again, as every read is, with its Vendor.
    const sent = await this.readById(partRequestId);
    return Either.flatMap(sent, (found) =>
      Either.fromOption(
        Option.map(found, (each) => each.getPartRequest()),
        () =>
          ServerError.of(
            `A Part Request was kept and could not be read back: ${partRequestId}`,
          ),
      ),
    );
  }

  listByVendor(
    vendorId: string,
    pageable: PageableAttributes,
  ): Promise<Either.Either<PartRequestsPage, StructuredError>> {
    if (!couldBeIdentifier(vendorId)) {
      return Promise.resolve(
        Either.right(new PartRequestsPage([], PageAttributes.of(pageable, 0))),
      );
    }

    return this.listWhere(
      eq(partRequest.vendorId, vendorId),
      [desc(partRequest.sentAt), asc(partRequest.id)],
      pageable,
      "A Vendor's Part Requests could not be listed",
    );
  }

  listOpen(
    pageable: PageableAttributes,
  ): Promise<Either.Either<PartRequestsPage, StructuredError>> {
    return this.listWhere(
      eq(partRequest.state, 'open'),
      [asc(partRequest.sentAt), asc(partRequest.id)],
      pageable,
      'The open Part Requests could not be listed',
    );
  }

  async readById(
    partRequestId: string,
  ): Promise<Either.Either<Option.Option<PartRequestAndOffer>, StructuredError>> {
    if (!couldBeIdentifier(partRequestId)) return Either.right(Option.none());

    try {
      const [row] = await this.withAll(this.databaseProvider.getClient()).where(
        eq(partRequest.id, partRequestId),
      );

      if (row === undefined) return Either.right(Option.none());
      return Either.map(toDomainWithOffer(row), Option.some);
    } catch (error) {
      this.logger.error(error, 'A Part Request could not be read');
      return Either.left(databaseErrorOf(error, 'A Part Request could not be read'));
    }
  }

  async fulfil(
    params: FulfilPartRequestParams,
  ): Promise<Either.Either<OfferFulfilment, StructuredError>> {
    const id = params.getPartRequestId();
    const partId = params.getPartId();
    if (!couldBeIdentifier(id)) return Either.left(partRequestNotFound(id));

    try {
      return await this.databaseProvider.getClient().transaction(async (transaction) => {
        // Held from the start, so that of two resolutions at once the second
        // waits here, then finds the request resolved, and changes nothing.
        const held = await holdThePartRequest(transaction, id);
        if (held === undefined) return Either.left(partRequestNotFound(id));
        if (held.state !== 'open') return Either.left(partRequestResolved(id));

        // Confirmed at the moment the request was sent, the Vendor's
        // statement of its prices; written now, by the Admin.
        const fulfilment = await theOfferFulfilled(transaction, held, partId, {
          details: held.details,
          confirmedAt: held.sentAt,
          writtenAt: params.getFulfilledAt(),
          callerId: params.getCallerId(),
        });
        if (fulfilment === undefined) {
          return Either.left(
            ServerError.of(
              `The Vendor's Offer for the Part came and went while the Part Request ${id} was fulfilled`,
            ),
          );
        }

        await transaction
          .update(partRequest)
          .set({ state: 'fulfilled', partId, resolvedAt: params.getFulfilledAt() })
          .where(eq(partRequest.id, id));
        return Either.right(fulfilment);
      });
    } catch (error) {
      this.logger.error(error, 'A Part Request could not be fulfilled');
      return Either.left(databaseErrorOf(error, 'A Part Request could not be fulfilled'));
    }
  }

  async reject(
    params: RejectPartRequestParams,
  ): Promise<Either.Either<void, StructuredError>> {
    const id = params.getPartRequestId();
    if (!couldBeIdentifier(id)) return Either.left(partRequestNotFound(id));

    try {
      return await this.databaseProvider.getClient().transaction(async (transaction) => {
        // Held from the start, as a fulfilment holds it.
        const held = await holdThePartRequest(transaction, id);
        if (held === undefined) return Either.left(partRequestNotFound(id));
        if (held.state !== 'open') return Either.left(partRequestResolved(id));

        await transaction
          .update(partRequest)
          .set({
            state: 'rejected',
            reason: params.getReason(),
            resolvedAt: params.getRejectedAt(),
          })
          .where(eq(partRequest.id, id));
        return Either.right(undefined);
      });
    } catch (error) {
      this.logger.error(error, 'A Part Request could not be rejected');
      return Either.left(databaseErrorOf(error, 'A Part Request could not be rejected'));
    }
  }

  // A Part Request's row with its Vendor, its Part and its photo, and the
  // Vendor's Offer for that Part now. A request that is not fulfilled has
  // no Part, and so meets none of them.
  private withAll(client: Pick<Transaction, 'select'>) {
    return client
      .select(partRequestWithAll)
      .from(partRequest)
      .innerJoin(vendor, eq(vendor.id, partRequest.vendorId))
      .leftJoin(part, eq(part.id, partRequest.partId))
      .leftJoin(partPhoto, eq(partPhoto.partId, part.id))
      .leftJoin(
        offer,
        and(eq(offer.vendorId, partRequest.vendorId), eq(offer.partId, partRequest.partId)),
      )
      .$dynamic();
  }

  // One page of the Part Requests that meet a condition, in an order that
  // ends with the identifier, so that moving between pages never skips or
  // repeats one, and their total, read in one snapshot, so that a request
  // sent or resolved between them cannot make the total disagree with the
  // page. One query at a time: the transaction holds one connection, and
  // node-postgres 9 refuses a query sent on it while another runs.
  private async listWhere(
    where: SQL,
    order: SQL[],
    pageable: PageableAttributes,
    failure: string,
  ): Promise<Either.Either<PartRequestsPage, StructuredError>> {
    try {
      const [rows, [{ total }]] = await this.databaseProvider.getClient().transaction(
        async (transaction) => {
          const page = await this.withAll(transaction)
            .where(where)
            .orderBy(...order)
            .limit(pageable.getLimit())
            .offset(pageable.getOffset());
          const totals = await transaction
            .select({ total: count() })
            .from(partRequest)
            .where(where);
          return [page, totals] as const;
        },
        { isolationLevel: 'repeatable read', accessMode: 'read only' },
      );

      return Either.map(
        Either.all(rows.map(toDomainWithOffer)),
        (found) => new PartRequestsPage(found, PageAttributes.of(pageable, total)),
      );
    } catch (error) {
      this.logger.error(error, failure);
      return Either.left(databaseErrorOf(error, failure));
    }
  }
}

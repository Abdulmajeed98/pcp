import { Injectable, Logger } from '@nestjs/common';
import {
  databaseErrorOf,
  PageableAttributes,
  PageAttributes,
  StructuredError,
} from '@pcp/core';
import { asc, count, desc, eq } from 'drizzle-orm';
import { Either } from 'effect';

import {
  RecordReferralParams,
  ReferralCountsPage,
  ReferralStore,
  VendorsReferralCount,
} from '~/domain/referral/ReferralStore';
import { DatabaseProvider } from '~/infrastructure/database/DatabaseProvider';
import { couldBeIdentifier } from '~/infrastructure/database/identifiers';
import { vendor } from '~/infrastructure/vendor/vendor.schema';

import { referral } from '../referral.schema';

@Injectable()
export class DatabaseReferralStore implements ReferralStore {
  private readonly logger = new Logger(DatabaseReferralStore.name);

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async record(
    params: RecordReferralParams,
  ): Promise<Either.Either<void, StructuredError>> {
    try {
      await this.databaseProvider.getClient().insert(referral).values({
        vendorId: params.getVendorId(),
        sharedBuildId: params.getSharedBuildId(),
        referredAt: params.getReferredAt(),
      });

      return Either.right(undefined);
    } catch (error) {
      this.logger.error(error, 'A Referral could not be recorded');
      return Either.left(databaseErrorOf(error, 'A Referral could not be recorded'));
    }
  }

  async listCounts(
    pageable: PageableAttributes,
  ): Promise<Either.Either<ReferralCountsPage, StructuredError>> {
    const referrals = count(referral.id);
    try {
      // One snapshot for both, so that a Referral or a Vendor added between
      // them cannot make the total disagree with the page. One query at a
      // time: the transaction holds one connection, and node-postgres 9
      // refuses a query sent on it while another runs.
      const [rows, [{ total }]] = await this.databaseProvider.getClient().transaction(
        async (transaction) => {
          const page = await transaction
            .select({
              id: vendor.id,
              name: vendor.name,
              active: vendor.active,
              count: referrals,
            })
            .from(vendor)
            .leftJoin(referral, eq(referral.vendorId, vendor.id))
            .groupBy(vendor.id)
            .orderBy(desc(referrals), asc(vendor.name), asc(vendor.id))
            .limit(pageable.getLimit())
            .offset(pageable.getOffset());
          const totals = await transaction.select({ total: count() }).from(vendor);
          return [page, totals] as const;
        },
        { isolationLevel: 'repeatable read', accessMode: 'read only' },
      );

      return Either.right(
        new ReferralCountsPage(
          rows.map(
            (row) => new VendorsReferralCount(row.id, row.name, row.active, row.count),
          ),
          PageAttributes.of(pageable, total),
        ),
      );
    } catch (error) {
      this.logger.error(error, 'The Referral counts could not be listed');
      return Either.left(databaseErrorOf(error, 'The Referral counts could not be listed'));
    }
  }

  async countFor(vendorId: string): Promise<Either.Either<number, StructuredError>> {
    if (!couldBeIdentifier(vendorId)) return Either.right(0);

    try {
      const [{ referrals }] = await this.databaseProvider
        .getClient()
        .select({ referrals: count() })
        .from(referral)
        .where(eq(referral.vendorId, vendorId));

      return Either.right(referrals);
    } catch (error) {
      this.logger.error(error, "A Vendor's Referral count could not be read");
      return Either.left(
        databaseErrorOf(error, "A Vendor's Referral count could not be read"),
      );
    }
  }
}

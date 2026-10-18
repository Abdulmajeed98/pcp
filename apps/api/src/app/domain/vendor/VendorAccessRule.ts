import { Injectable } from '@nestjs/common';
import { Role, StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { Vendor } from './Vendor';
import { vendorAccessDenied, vendorNotFound } from './vendor-errors';
import { VendorStore } from './VendorStore';

// The rule for which Vendor a request acts for, written once for every
// Vendor portal endpoint, those of later modules among them. The controller
// hands it the Caller's identifier and roles as plain values.
//
// - A Caller that holds the `admin` role may act for any Vendor.
// - A Caller that holds only the `vendor` role may act only for the Vendor
//   whose Login it is.
// - A Vendor named that is not the Caller's own is refused with 403, whether
//   it exists or not, so that a Vendor learns nothing about another Vendor's
//   identifier.
@Injectable()
export class VendorAccessRule {
  constructor(private readonly vendorStore: VendorStore) {}

  // The Vendor a request that names `vendorId` acts for, or why it may not.
  async vendorActedFor(
    callerId: string,
    callerRoles: readonly Role[],
    vendorId: string,
  ): Promise<Either.Either<Vendor, StructuredError>> {
    if (callerRoles.includes(Role.ADMIN)) {
      const found = await this.vendorStore.readById(vendorId);
      return Either.flatMap(found, (vendor) =>
        Option.match(vendor, {
          onNone: () => Either.left(vendorNotFound(vendorId)),
          onSome: (existing) => Either.right(existing),
        }),
      );
    }

    const own = await this.ownVendorOf(callerId);
    return Either.flatMap(own, (vendor) =>
      Option.match(
        Option.filter(vendor, (existing) => existing.getId() === vendorId),
        {
          onNone: () => Either.left(vendorAccessDenied(callerId, vendorId)),
          onSome: (existing) => Either.right(existing),
        },
      ),
    );
  }

  // The Vendor whose Login the Caller is, found by the Login's identifier,
  // which stays when the Login's name changes. None when no Vendor is behind
  // the Login, as for one made by hand in Keycloak's console.
  async ownVendorOf(
    callerId: string,
  ): Promise<Either.Either<Option.Option<Vendor>, StructuredError>> {
    return this.vendorStore.readByLoginId(callerId);
  }
}

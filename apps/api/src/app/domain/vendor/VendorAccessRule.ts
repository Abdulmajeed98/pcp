import { Injectable } from '@nestjs/common';
import { Role, StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { Vendor } from './Vendor';
import { existingVendor } from './existing-vendor';
import { vendorAccessDenied, vendorDeactivated } from './vendor-errors';
import { VendorStore } from './VendorStore';

// The rule for which Vendor a request acts for, written once for every
// Vendor portal endpoint, those of later modules among them. The controller
// hands it the Caller's identifier and roles as plain values.
//
// - A Caller that holds the `admin` role may act for any Vendor, active or
//   deactivated.
// - Any other Caller, which the endpoint lets in by its `vendor` role, may
//   act only for the Vendor whose Login it is, and only while that Vendor is
//   active. Its own Vendor, deactivated, is refused with 403 and
//   `VENDOR_DEACTIVATED`. This is read from the database on every request,
//   so a deactivated Vendor is refused at once, whatever its token says.
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
      return existingVendor(vendorId, await this.vendorStore.readById(vendorId));
    }

    const own = await this.ownVendorOf(callerId);
    return Either.flatMap(own, (vendor) =>
      Either.fromOption(
        Option.filter(vendor, (existing) => existing.getId() === vendorId),
        () => vendorAccessDenied(callerId, vendorId),
      ),
    );
  }

  // The Vendor whose Login the Caller is, found by the Login's identifier,
  // which stays when the Login's name changes. None when no Vendor is behind
  // the Login, as for one made by hand in Keycloak's console. A deactivated
  // Vendor is refused, so neither a Vendor portal endpoint nor the Caller's
  // Vendor answers its Login.
  async ownVendorOf(
    callerId: string,
  ): Promise<Either.Either<Option.Option<Vendor>, StructuredError>> {
    const own = await this.vendorStore.readByLoginId(callerId);

    return Either.flatMap(own, (vendor) =>
      Option.isSome(vendor) && !vendor.value.isActive()
        ? Either.left(vendorDeactivated(vendor.value.getId()))
        : Either.right(vendor),
    );
  }
}

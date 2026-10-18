import { Injectable, Logger } from '@nestjs/common';
import {
  databaseErrorOf,
  PageableAttributes,
  PageAttributes,
  ServerError,
  StructuredError,
} from '@pcp/core';
import { asc, count, eq, SQL } from 'drizzle-orm';
import { Either, Option } from 'effect';

import { PhoneNumber } from '~/domain/phone-number/PhoneNumber';
import { City } from '~/domain/vendor/City';
import { ContactDetails } from '~/domain/vendor/ContactDetails';
import { MapLocation } from '~/domain/vendor/MapLocation';
import { Vendor } from '~/domain/vendor/Vendor';
import { CreateVendorParams, VendorsPage, VendorStore } from '~/domain/vendor/VendorStore';
import { DatabaseProvider } from '~/infrastructure/database/DatabaseProvider';
import { couldBeIdentifier } from '~/infrastructure/database/identifiers';

import { vendor, VendorRow } from '../vendor.schema';

// A stored phone number as the domain's, or a server error naming the Vendor
// and the detail.
function phoneNumberOf(
  row: VendorRow,
  detail: string,
  stored: string,
): Either.Either<PhoneNumber, StructuredError> {
  return Either.mapLeft(PhoneNumber.read(stored), () =>
    ServerError.of(`A Vendor has a ${detail} the API cannot read: ${row.id}`),
  );
}

// A row's contact details as the domain's.
function contactDetailsOf(row: VendorRow): Either.Either<ContactDetails, StructuredError> {
  let mapLocation: MapLocation | null = null;
  if (row.latitude !== null && row.longitude !== null) {
    const location = MapLocation.of(row.latitude, row.longitude);
    if (Either.isLeft(location)) {
      return Either.left(
        ServerError.of(`A Vendor has a map location the API cannot take: ${row.id}`),
      );
    }
    mapLocation = location.right;
  }
  const phoneNumber = phoneNumberOf(row, 'phone number', row.phoneNumber);
  if (Either.isLeft(phoneNumber)) return Either.left(phoneNumber.left);
  let whatsAppNumber: PhoneNumber | null = null;
  if (row.whatsAppNumber !== null) {
    const read = phoneNumberOf(row, 'WhatsApp number', row.whatsAppNumber);
    if (Either.isLeft(read)) return Either.left(read.left);
    whatsAppNumber = read.right;
  }

  return Either.right(
    new ContactDetails(
      row.address,
      mapLocation,
      phoneNumber.right,
      whatsAppNumber,
      row.instagramName,
      row.openingHours,
    ),
  );
}

// A row as a Vendor. The database's list of cities is made from the
// domain's, and every phone number and map location is checked before it is
// stored, so a row that the domain cannot read means the two have drifted
// apart.
function toDomain(row: VendorRow): Either.Either<Vendor, StructuredError> {
  const city = City.withKey(row.city);
  if (city === undefined) {
    return Either.left(
      ServerError.of(`A Vendor has a city the API does not know: ${row.city}`),
    );
  }
  const contactDetails = contactDetailsOf(row);
  if (Either.isLeft(contactDetails)) return Either.left(contactDetails.left);
  const loginPhoneNumber = phoneNumberOf(row, 'login phone number', row.loginPhoneNumber);
  if (Either.isLeft(loginPhoneNumber)) return Either.left(loginPhoneNumber.left);

  return Either.right(
    new Vendor(
      row.id,
      row.name,
      city,
      contactDetails.right,
      loginPhoneNumber.right,
      row.loginId,
      row.active,
      row.createdAt,
      row.updatedAt,
    ),
  );
}

// Contact details as the columns that hold them.
function contactDetailsColumns(contactDetails: ContactDetails) {
  const mapLocation = contactDetails.getMapLocation();

  return {
    address: contactDetails.getAddress(),
    latitude: mapLocation?.getLatitude() ?? null,
    longitude: mapLocation?.getLongitude() ?? null,
    phoneNumber: contactDetails.getPhoneNumber().getInternational(),
    whatsAppNumber: contactDetails.getWhatsAppNumber()?.getInternational() ?? null,
    instagramName: contactDetails.getInstagramName(),
    openingHours: contactDetails.getOpeningHours(),
  };
}

@Injectable()
export class DatabaseVendorStore implements VendorStore {
  private readonly logger = new Logger(DatabaseVendorStore.name);

  constructor(private readonly databaseProvider: DatabaseProvider) {}

  async create(
    params: CreateVendorParams,
  ): Promise<Either.Either<Vendor, StructuredError>> {
    try {
      const [row] = await this.databaseProvider
        .getClient()
        .insert(vendor)
        .values({
          name: params.getName(),
          city: params.getCity().getKey(),
          ...contactDetailsColumns(params.getContactDetails()),
          loginPhoneNumber: params.getLoginPhoneNumber().getInternational(),
          loginId: params.getLoginId(),
        })
        .returning();

      return toDomain(row);
    } catch (error) {
      this.logger.error(error, 'A Vendor could not be created');
      return Either.left(databaseErrorOf(error, 'A Vendor could not be created'));
    }
  }

  async list(
    pageable: PageableAttributes,
  ): Promise<Either.Either<VendorsPage, StructuredError>> {
    try {
      // One snapshot for both, so that a Vendor created between them cannot
      // make the totals disagree with the page.
      const [rows, [{ total }]] = await this.databaseProvider
        .getClient()
        .transaction(
          (transaction) =>
            Promise.all([
              transaction
                .select()
                .from(vendor)
                .orderBy(asc(vendor.name), asc(vendor.id))
                .limit(pageable.getLimit())
                .offset(pageable.getOffset()),
              transaction.select({ total: count() }).from(vendor),
            ]),
          { isolationLevel: 'repeatable read', accessMode: 'read only' },
        );

      return Either.map(
        Either.all(rows.map(toDomain)),
        (vendors) => new VendorsPage(vendors, PageAttributes.of(pageable, total)),
      );
    } catch (error) {
      this.logger.error(error, 'The Vendors could not be listed');
      return Either.left(databaseErrorOf(error, 'The Vendors could not be listed'));
    }
  }

  async editContactDetails(
    id: string,
    contactDetails: ContactDetails,
  ): Promise<Either.Either<Option.Option<Vendor>, StructuredError>> {
    if (!couldBeIdentifier(id)) return Either.right(Option.none());

    try {
      const [row] = await this.databaseProvider
        .getClient()
        .update(vendor)
        .set(contactDetailsColumns(contactDetails))
        .where(eq(vendor.id, id))
        .returning();

      if (row === undefined) return Either.right(Option.none());
      return Either.map(toDomain(row), Option.some);
    } catch (error) {
      this.logger.error(error, "A Vendor's contact details could not be changed");
      return Either.left(
        databaseErrorOf(error, "A Vendor's contact details could not be changed"),
      );
    }
  }

  async readById(
    id: string,
  ): Promise<Either.Either<Option.Option<Vendor>, StructuredError>> {
    if (!couldBeIdentifier(id)) return Either.right(Option.none());

    return this.readOneWhere(eq(vendor.id, id));
  }

  async readByLoginId(
    loginId: string,
  ): Promise<Either.Either<Option.Option<Vendor>, StructuredError>> {
    if (!couldBeIdentifier(loginId)) return Either.right(Option.none());

    return this.readOneWhere(eq(vendor.loginId, loginId));
  }

  async readByLoginPhoneNumber(
    loginPhoneNumber: PhoneNumber,
  ): Promise<Either.Either<Option.Option<Vendor>, StructuredError>> {
    return this.readOneWhere(
      eq(vendor.loginPhoneNumber, loginPhoneNumber.getInternational()),
    );
  }

  private async readOneWhere(
    where: SQL,
  ): Promise<Either.Either<Option.Option<Vendor>, StructuredError>> {
    try {
      const [row] = await this.databaseProvider
        .getClient()
        .select()
        .from(vendor)
        .where(where);

      if (row === undefined) return Either.right(Option.none());
      return Either.map(toDomain(row), Option.some);
    } catch (error) {
      this.logger.error(error, 'A Vendor could not be read');
      return Either.left(databaseErrorOf(error, 'A Vendor could not be read'));
    }
  }
}

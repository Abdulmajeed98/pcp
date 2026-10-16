import { Injectable, Logger } from '@nestjs/common';
import { databaseErrorOf, ServerError, StructuredError } from '@pcp/core';
import { eq, SQL } from 'drizzle-orm';
import { Either, Option } from 'effect';

import { PhoneNumber } from '~/domain/phone-number/PhoneNumber';
import { City } from '~/domain/vendor/City';
import { Vendor } from '~/domain/vendor/Vendor';
import { CreateVendorParams, VendorStore } from '~/domain/vendor/VendorStore';
import { DatabaseProvider } from '~/infrastructure/database/DatabaseProvider';
import { couldBeIdentifier } from '~/infrastructure/database/identifiers';

import { vendor, VendorRow } from '../vendor.schema';

// A row as a Vendor. The database's list of cities is made from the
// domain's, and every phone number is checked before it is stored, so a row
// that the domain cannot read means the two have drifted apart.
function toDomain(row: VendorRow): Either.Either<Vendor, StructuredError> {
  const city = City.withKey(row.city);
  if (city === undefined) {
    return Either.left(
      ServerError.of(`A Vendor has a city the API does not know: ${row.city}`),
    );
  }
  const loginPhoneNumber = PhoneNumber.read(row.loginPhoneNumber);
  if (Either.isLeft(loginPhoneNumber)) {
    return Either.left(
      ServerError.of(`A Vendor has a login phone number the API cannot read: ${row.id}`),
    );
  }

  return Either.right(
    new Vendor(
      row.id,
      row.name,
      city,
      loginPhoneNumber.right,
      row.loginId,
      row.active,
      row.createdAt,
      row.updatedAt,
    ),
  );
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

  async readById(
    id: string,
  ): Promise<Either.Either<Option.Option<Vendor>, StructuredError>> {
    if (!couldBeIdentifier(id)) return Either.right(Option.none());

    return this.readOneWhere(eq(vendor.id, id));
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

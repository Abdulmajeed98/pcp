import { Injectable } from '@nestjs/common';
import { StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { Currency } from '../currency/currency';
import { Build, BuildPart } from './Build';
import { BuildStore, CatalogPart, NamedPart } from './BuildStore';
import { PartAsked, partsAskedIn } from './parts-asked';

// The reading of a Build that a request gives in its `part` values, written
// once for every endpoint that takes a Build. Each value is a Part's
// identifier, followed for a RAM kit or a drive by `:` and its quantity.
@Injectable()
export class BuildReading {
  constructor(private readonly buildStore: BuildStore) {}

  // The Build the values give, its Parts as the catalog holds them, each
  // with whether it is a Visible Part and its in-stock Visible Offers in the
  // currency, at now by the API's clock and at one Platform Rate, or the
  // refusal of the values, naming `part`: reading a Build (`GET v1/build`).
  async read(
    values: readonly string[],
    currency: Currency,
    now: Date,
  ): Promise<Either.Either<Build<CatalogPart>, StructuredError>> {
    return this.readWith(values, (partIds) =>
      this.buildStore.readParts(partIds, currency, now),
    );
  }

  // The Build the values give, its Parts as the catalog holds them and
  // nothing of their Offers, or the refusal of the values, naming `part`, as
  // `read` refuses them: what the picker judges each Part against (BLD-3),
  // which reads the Build's specifications and nothing else of the catalog.
  async readForTheRules(
    values: readonly string[],
  ): Promise<Either.Either<Build, StructuredError>> {
    return this.readWith(values, (partIds) => this.buildStore.readNamedParts(partIds));
  }

  // The values read, the catalog asked for the Parts they name, and the Build
  // made of the Parts it holds, in the values' order, each with the quantity
  // given with it. A Part the catalog does not hold is left out.
  private async readWith<Read extends NamedPart>(
    values: readonly string[],
    readTheParts: (
      partIds: readonly string[],
    ) => Promise<Either.Either<readonly Read[], StructuredError>>,
  ): Promise<Either.Either<Build<Read>, StructuredError>> {
    const asked = partsAskedIn(values);
    if (Either.isLeft(asked)) return Either.left(asked.left);

    const found = await readTheParts(asked.right.map((part) => part.getPartId()));
    return Either.flatMap(found, (parts) =>
      Build.of(asked.right.flatMap((each) => heldIn(parts, each))),
    );
  }
}

// The Build's Part a value names, when the catalog holds it.
function heldIn<Read extends NamedPart>(
  parts: readonly Read[],
  asked: PartAsked,
): BuildPart<Read>[] {
  const held = parts.find((part) => part.getPart().getId() === asked.getPartId());
  return held === undefined ? [] : [new BuildPart(held, asked.getQuantity())];
}

import { Injectable } from '@nestjs/common';
import { PageableAttributes, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { specificationListOf } from '../specification/specification-lists';
import { Category } from './Category';
import {
  ListPartsMissingSpecificationsParams,
  PartsMissingSpecificationsPage,
  PartStore,
} from './PartStore';

class Input {
  constructor(private readonly pageable: PageableAttributes) {}

  getPageable(): PageableAttributes {
    return this.pageable;
  }
}

class Output {
  private constructor(private readonly page: PartsMissingSpecificationsPage) {}

  static of(page: PartsMissingSpecificationsPage): Output {
    return new Output(page);
  }

  getPage(): PartsMissingSpecificationsPage {
    return this.page;
  }
}

export { Input as ListPartsMissingSpecificationsQueryInput };
export { Output as ListPartsMissingSpecificationsQueryOutput };

// The Admin lists, a page at a time, every Part that has an Offer and lacks a
// needed specification, so that compatibility checking stays whole (CAT-8).
// The needed specifications are read from each Category's list in code at
// every request, so that a change to a list changes the answer at once. A
// Part on the list is still shown to Shoppers.
@Injectable()
export class ListPartsMissingSpecificationsQuery {
  constructor(private readonly partStore: PartStore) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const needed = new Map(
      Category.values().map((category) => [
        category,
        specificationListOf(category).getNeeded(),
      ]),
    );

    const page = await this.partStore.listMissingSpecifications(
      new ListPartsMissingSpecificationsParams(needed, input.getPageable()),
    );

    return Either.map(page, Output.of);
  }
}

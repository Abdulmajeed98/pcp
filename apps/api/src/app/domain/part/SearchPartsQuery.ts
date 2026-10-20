import { Injectable } from '@nestjs/common';
import { PageableAttributes, Role, StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { VendorAccessRule } from '../vendor/VendorAccessRule';
import { Category } from './Category';
import { PartsPage, PartStore, SearchPartsParams } from './PartStore';
import { searchWordsOf } from './search-words';

class Input {
  constructor(
    private readonly callerId: string,
    private readonly callerRoles: readonly Role[],
    private readonly term: string,
    private readonly category: Category | undefined,
    private readonly vendorId: string | undefined,
    private readonly pageable: PageableAttributes,
  ) {}

  // The identifier of the Login the request was made with.
  getCallerId(): string {
    return this.callerId;
  }

  getCallerRoles(): readonly Role[] {
    return this.callerRoles;
  }

  getTerm(): string {
    return this.term;
  }

  getCategory(): Category | undefined {
    return this.category;
  }

  // The Vendor the request names, whose Offers the results name, if any.
  getVendorId(): string | undefined {
    return this.vendorId;
  }

  getPageable(): PageableAttributes {
    return this.pageable;
  }
}

class Output {
  private constructor(private readonly page: PartsPage) {}

  static of(page: PartsPage): Output {
    return new Output(page);
  }

  getPartsPage(): PartsPage {
    return this.page;
  }
}

export { Input as SearchPartsQueryInput };
export { Output as SearchPartsQueryOutput };

// The Admin or a Vendor searches the whole catalog (CAT-7). A term is split
// into words at spaces, and a Part is found when it holds every word, in any
// order. An empty term finds every Part.
//
// The results name one Vendor's Offer for each Part it offers, so that the
// Vendor portal's search leads to an Offer the Vendor already has (OFF-1,
// OFF-3): the Vendor the request names, by the rule for which Vendor a
// request acts for, or, when it names none, the Vendor whose Login the Caller
// is. The Admin naming none gets no Vendor's.
@Injectable()
export class SearchPartsQuery {
  constructor(
    private readonly partStore: PartStore,
    private readonly vendorAccessRule: VendorAccessRule,
  ) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const offersOf = await this.vendorWhoseOffersToName(input);
    if (Either.isLeft(offersOf)) return Either.left(offersOf.left);

    const page = await this.partStore.search(
      new SearchPartsParams(
        searchWordsOf(input.getTerm()),
        input.getCategory(),
        input.getPageable(),
        offersOf.right,
      ),
    );

    return Either.map(page, Output.of);
  }

  // The identifier of the Vendor whose Offers the results name, or none, or
  // why the request may not name the Vendor it names. A Login with no Vendor
  // behind it names none, and a deactivated Vendor's own Login is refused,
  // as at every Vendor portal endpoint.
  private async vendorWhoseOffersToName(
    input: Input,
  ): Promise<Either.Either<Option.Option<string>, StructuredError>> {
    const vendorId = input.getVendorId();
    if (vendorId !== undefined) {
      const actedFor = await this.vendorAccessRule.vendorActedFor(
        input.getCallerId(),
        input.getCallerRoles(),
        vendorId,
      );
      return Either.map(actedFor, (vendor) => Option.some(vendor.getId()));
    }

    if (input.getCallerRoles().includes(Role.ADMIN)) return Either.right(Option.none());

    const own = await this.vendorAccessRule.ownVendorOf(input.getCallerId());
    return Either.map(
      own,
      Option.map((vendor) => vendor.getId()),
    );
  }
}

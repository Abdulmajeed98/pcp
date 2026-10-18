import { Injectable } from '@nestjs/common';
import { PageableAttributes, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { VendorsPage, VendorStore } from './VendorStore';

class Input {
  constructor(private readonly pageable: PageableAttributes) {}

  getPageable(): PageableAttributes {
    return this.pageable;
  }
}

class Output {
  private constructor(private readonly page: VendorsPage) {}

  static of(page: VendorsPage): Output {
    return new Output(page);
  }

  getVendorsPage(): VendorsPage {
    return this.page;
  }
}

export { Input as ListVendorsQueryInput };
export { Output as ListVendorsQueryOutput };

// The Admin lists every Vendor, active and deactivated, a page at a time, in
// name order.
@Injectable()
export class ListVendorsQuery {
  constructor(private readonly vendorStore: VendorStore) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const page = await this.vendorStore.list(input.getPageable());

    return Either.map(page, Output.of);
  }
}

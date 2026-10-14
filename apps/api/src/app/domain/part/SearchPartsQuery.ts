import { Injectable } from '@nestjs/common';
import { PageableAttributes, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { Category } from './Category';
import { PartsPage, PartStore, SearchPartsParams } from './PartStore';

class Input {
  constructor(
    private readonly term: string,
    private readonly category: Category | undefined,
    private readonly pageable: PageableAttributes,
  ) {}

  getTerm(): string {
    return this.term;
  }

  getCategory(): Category | undefined {
    return this.category;
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
@Injectable()
export class SearchPartsQuery {
  constructor(private readonly partStore: PartStore) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const words = input
      .getTerm()
      .split(/\s+/)
      .filter((word) => word !== '');

    const page = await this.partStore.search(
      new SearchPartsParams(words, input.getCategory(), input.getPageable()),
    );

    return Either.map(page, Output.of);
  }
}

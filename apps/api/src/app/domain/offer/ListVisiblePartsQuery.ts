import { Injectable } from '@nestjs/common';
import { PageableAttributes, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { Currency } from '../currency/currency';
import { Category } from '../part/Category';
import { searchWordsOf } from '../part/search-words';
import { ListVisiblePartsParams, OfferStore, VisiblePartsPage } from './OfferStore';

class Input {
  constructor(
    private readonly category: Category,
    private readonly currency: Currency,
    private readonly term: string,
    private readonly pageable: PageableAttributes,
  ) {}

  getCategory(): Category {
    return this.category;
  }

  // The chosen currency, which every Lowest Price is in and the Parts are
  // ordered by.
  getCurrency(): Currency {
    return this.currency;
  }

  getTerm(): string {
    return this.term;
  }

  getPageable(): PageableAttributes {
    return this.pageable;
  }
}

class Output {
  private constructor(private readonly page: VisiblePartsPage) {}

  static of(page: VisiblePartsPage): Output {
    return new Output(page);
  }

  getPage(): VisiblePartsPage {
    return this.page;
  }
}

export { Input as ListVisiblePartsQueryInput };
export { Output as ListVisiblePartsQueryOutput };

// One page of a Category's Visible Parts, for anyone, with no Login (CAT-7,
// BRW-1): the Parts with at least one Visible Offer, each with its Lowest
// Price in the chosen currency, lowest first, and those that every Vendor has
// out of stock last. A term is read as the catalog search reads it, so a Part
// is found when it holds every word, in any order and any case, in its name,
// its manufacturer or a part number (BRW-2), and an empty term finds every
// Visible Part.
@Injectable()
export class ListVisiblePartsQuery {
  constructor(private readonly offerStore: OfferStore) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    // Read once, so that every Offer's visibility is judged at one moment.
    const now = new Date();
    const page = await this.offerStore.listVisibleParts(
      new ListVisiblePartsParams(
        input.getCategory(),
        input.getCurrency(),
        searchWordsOf(input.getTerm()),
        input.getPageable(),
        now,
      ),
    );

    return Either.map(page, Output.of);
  }
}

import { Injectable } from '@nestjs/common';
import { PageableAttributes, PageAttributes, StructuredError } from '@pcp/core';
import { Either } from 'effect';

import { BuildReading } from '../build/BuildReading';
import { compatibleWith } from '../build/compatible';
import { Currency } from '../currency/currency';
import { Category } from '../part/Category';
import { searchWordsOf } from '../part/search-words';
import { choicesOf } from '../specification/filters';
import { PriceRange } from './PriceRange';
import { VisiblePart } from './VisiblePart';
import {
  ListVisiblePartsParams,
  VisiblePartsPage,
  VisiblePartStore,
} from './VisiblePartStore';

class Input {
  constructor(
    private readonly category: Category,
    private readonly currency: Currency,
    private readonly term: string,
    private readonly manufacturers: readonly string[],
    private readonly filters: ReadonlyMap<string, readonly string[]>,
    private readonly lowest: number | undefined,
    private readonly highest: number | undefined,
    private readonly inStockOnly: boolean,
    private readonly partValues: readonly string[],
    private readonly keepNotCompatible: boolean,
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

  // The manufacturers asked for, any of which a Part's matches; none asks for
  // every one.
  getManufacturers(): readonly string[] {
    return this.manufacturers;
  }

  // The texts the request gives each filter's parameter it names, as it
  // gives them, before they are read as the filter's values.
  getFilters(): ReadonlyMap<string, readonly string[]> {
    return this.filters;
  }

  // The ends of the price range asked for, in whole ones of the chosen
  // currency, either left out.
  getLowest(): number | undefined {
    return this.lowest;
  }

  getHighest(): number | undefined {
    return this.highest;
  }

  // Whether only the Visible Parts with an in-stock Visible Offer are asked
  // for, as the picker asks (BLD-2).
  isInStockOnly(): boolean {
    return this.inStockOnly;
  }

  // The `part` values the request gives, as it gives them, before they are
  // read as the Build the picker judges each Part against; none without a
  // Build.
  getPartValues(): readonly string[] {
    return this.partValues;
  }

  // Whether the Parts that are not Compatible with the Build are kept, as the
  // picker's switch asks; they are left out otherwise.
  isKeepingNotCompatible(): boolean {
    return this.keepNotCompatible;
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
// Visible Part. The manufacturers and the Category's filters narrow the list
// with the search (BRW-2): a Part matches a filter when it holds any of the
// values asked of it, and it is listed when it matches every filter asked. A
// filter the Category does not have, or a value not of its filter's kind, is
// refused, naming its parameter. So is a price range whose lowest end is
// above its highest; a Part is within it when its Lowest Price, as
// answered, after rounding, is within both ends.
//
// The picker's conditions: in stock only keeps the Parts with an in-stock
// Visible Offer (BLD-2). Given a Build, read as reading a Build reads it and
// refused as it refuses it, naming `part`, each Part answers whether it is
// Compatible with it, and those that are not are left out unless the switch
// keeps them, in their place in the order (BLD-3). Every Part is judged
// before the list is paged, so that the page and the total count only the
// Parts kept.
@Injectable()
export class ListVisiblePartsQuery {
  constructor(
    private readonly visiblePartStore: VisiblePartStore,
    private readonly buildReading: BuildReading,
  ) {}

  async execute(input: Input): Promise<Either.Either<Output, StructuredError>> {
    const choices = choicesOf(input.getCategory(), input.getFilters());
    if (Either.isLeft(choices)) return Either.left(choices.left);
    const range = PriceRange.between(input.getLowest(), input.getHighest());
    if (Either.isLeft(range)) return Either.left(range.left);

    // Read once, so that every Offer's visibility is judged at one moment.
    const now = new Date();
    const params = new ListVisiblePartsParams(
      input.getCategory(),
      input.getCurrency(),
      searchWordsOf(input.getTerm()),
      input.getManufacturers(),
      choices.right,
      range.right,
      input.isInStockOnly(),
      now,
    );
    if (input.getPartValues().length === 0) {
      const page = await this.visiblePartStore.listVisibleParts(
        params,
        input.getPageable(),
      );
      return Either.map(page, Output.of);
    }

    const build = await this.buildReading.read(
      input.getPartValues(),
      input.getCurrency(),
      now,
    );
    if (Either.isLeft(build)) return Either.left(build.left);
    const every = await this.visiblePartStore.listEveryVisiblePart(params);
    if (Either.isLeft(every)) return Either.left(every.left);

    // Each Part judged, then the Parts kept paged, so that the page and the
    // total count only those.
    const compatible = compatibleWith(build.right);
    const kept = every.right
      .map((visible) => visible.judged(compatible(visible.getPart())))
      .filter((visible) => input.isKeepingNotCompatible() || visible.isCompatible());
    return Either.right(Output.of(onePageOf(kept, input.getPageable())));
  }
}

// One page of a list, as the catalog's paging gives it: the items past the
// page's offset, as many as it holds, and where the page stands among them
// all, so that a page past the end is empty and still answers the total.
function onePageOf(
  parts: readonly VisiblePart[],
  pageable: PageableAttributes,
): VisiblePartsPage {
  const offset = pageable.getOffset();
  return new VisiblePartsPage(
    parts.slice(offset, offset + pageable.getLimit()),
    PageAttributes.of(pageable, parts.length),
  );
}

import { PageableAttributes, PageAttributes, StructuredError } from '@pcp/core';
import { Either, Option } from 'effect';

import { Currency } from '../currency/currency';
import { Category } from '../part/Category';
import { Part } from '../part/Part';
import { FilterChoice } from '../specification/filters';

import { PriceRange } from './PriceRange';
import { VisiblePart } from './VisiblePart';
import { VisiblePartsFilters } from './VisiblePartsFilters';

// What a Category's list of Visible Parts asks for, on any page: the
// Category, the chosen currency every Lowest Price is in, the words every
// Part holds, the manufacturers one of which every Part's is, the choices
// among the Category's filters every Part matches, the range every Part's
// Lowest Price is within, whether every Part has an in-stock Visible Offer,
// and now, by the API's clock, which every Offer's visibility is judged by.
export class ListVisiblePartsParams {
  constructor(
    private readonly category: Category,
    private readonly currency: Currency,
    private readonly words: readonly string[],
    private readonly manufacturers: readonly string[],
    private readonly choices: readonly FilterChoice[],
    private readonly priceRange: PriceRange,
    private readonly inStockOnly: boolean,
    private readonly now: Date,
  ) {}

  getCategory(): Category {
    return this.category;
  }

  getCurrency(): Currency {
    return this.currency;
  }

  getWords(): readonly string[] {
    return this.words;
  }

  // None asks for every manufacturer.
  getManufacturers(): readonly string[] {
    return this.manufacturers;
  }

  getChoices(): readonly FilterChoice[] {
    return this.choices;
  }

  getPriceRange(): PriceRange {
    return this.priceRange;
  }

  isInStockOnly(): boolean {
    return this.inStockOnly;
  }

  getNow(): Date {
    return this.now;
  }
}

// One page of a Category's Visible Parts, and where it stands among them all.
export class VisiblePartsPage {
  constructor(
    private readonly parts: readonly VisiblePart[],
    private readonly page: PageAttributes,
  ) {}

  getParts(): readonly VisiblePart[] {
    return this.parts;
  }

  getPageAttributes(): PageAttributes {
    return this.page;
  }
}

// What a Category's filters ask for: the Category, the chosen currency the
// range of Lowest Prices is in, whether only the Parts with an in-stock
// Visible Offer give the values, and now, by the API's clock, which every
// Offer's visibility is judged by.
export class ReadVisiblePartsFiltersParams {
  constructor(
    private readonly category: Category,
    private readonly currency: Currency,
    private readonly inStockOnly: boolean,
    private readonly now: Date,
  ) {}

  getCategory(): Category {
    return this.category;
  }

  getCurrency(): Currency {
    return this.currency;
  }

  isInStockOnly(): boolean {
    return this.inStockOnly;
  }

  getNow(): Date {
    return this.now;
  }
}

// Where Shoppers' Visible Parts are read: a Category's list of them, the
// list's filters, and one Visible Part, each by the rule for a Visible Part,
// a Part with at least one Visible Offer. It is the port: the domain says
// what it needs, and infrastructure provides it.
export abstract class VisiblePartStore {
  // One page of the Category's Visible Parts that hold every word, whose
  // manufacturer is one of those asked, if any, and that match every choice
  // among the Category's filters, by holding any of the values chosen of it;
  // judged at the params' now by the rule for a Visible Part: a Part with at
  // least one Visible Offer, by the rule in `visibility.ts`. A Part missing a
  // filter's specification, or holding a value that stands for "not known",
  // matches no value of that filter. A price range with an end leaves out a
  // Part with no Lowest Price, and keeps those whose Lowest Price, as
  // answered, after rounding, is within both ends. In stock only leaves out
  // a Part none of whose Visible Offers is in stock. Each has its Lowest
  // Price in the currency, from the Shown Prices of its in-stock Visible
  // Offers at the current Platform Rate, which is read in the same query as
  // the Parts, the page and the total, so that one answer never mixes two
  // rates. Parts with a Lowest Price come first, the lowest first, compared
  // as answered, after rounding (BRW-1, PRC-4); then the in-stock Parts with
  // none, which happens only with no Platform Rate; then the Parts whose
  // Visible Offers are all out of stock; then by name and identifier, so that
  // moving between pages never skips or repeats one.
  abstract listVisibleParts(
    params: ListVisiblePartsParams,
    pageable: PageableAttributes,
  ): Promise<Either.Either<VisiblePartsPage, StructuredError>>;

  // Every one of the Visible Parts `listVisibleParts` pages, by the same rules
  // and in the same order, read in one query with the current Platform Rate,
  // each with its Part's specifications, for the picker to judge each before
  // it is paged (BLD-3).
  abstract listEveryVisiblePart(
    params: ListVisiblePartsParams,
  ): Promise<Either.Either<readonly VisiblePart[], StructuredError>>;

  // The Category's filters, read from all its Visible Parts at the params'
  // now, by the same rule as its list, before any filter or search, and in
  // stock only from those with an in-stock Visible Offer alone: the
  // manufacturers they have; for each filter in `filters.ts`, the distinct
  // values they hold, numbers by size and text alphabetically, leaving out a
  // value that stands for "not known" and a filter none holds a value of;
  // and the lowest and highest of their Lowest Prices in the currency, at the
  // current Platform Rate, read in the same query as the Parts.
  abstract readVisiblePartsFilters(
    params: ReadVisiblePartsFiltersParams,
  ): Promise<Either.Either<VisiblePartsFilters, StructuredError>>;

  // The Part with this identifier when it is a Visible Part at now by the
  // API's clock, by the same rule as a Category's list of them: a Part with
  // at least one visible Offer, by the rule in `visibility.ts`. None when it
  // is not visible, or there is no such Part.
  abstract readVisiblePart(
    partId: string,
    now: Date,
  ): Promise<Either.Either<Option.Option<Part>, StructuredError>>;
}

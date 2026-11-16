import { ApiPropertyOptional } from '@nestjs/swagger';
import { PagingRequest } from '@pcp/core';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches } from 'class-validator';

import { type Currency } from '~/domain/currency/currency';
import { ListVisiblePartsQueryInput } from '~/domain/offer/ListVisiblePartsQuery';
import { PickersConditions } from '~/domain/offer/PickersConditions';
import { Category } from '~/domain/part/Category';
import { filterParameters, type FilterKind } from '~/domain/specification/filters';
import { BuildAsked } from '~/infrastructure/build/endpoints/build-asked';

import { asAList } from './as-a-list';
import {
  CategoryAsked,
  ChosenCurrencyAsked,
  theCategoryAsked,
} from './category-and-currency';
import { isOn, SwitchAsked } from './switch-asked';

// A whole number in Western digits, as a Shopper app sends one, short enough
// to be read exactly.
const wholeNumber = /^\d{1,15}$/;

// What a Category's list of Visible Parts asks for, from the address's query:
// the Category, the chosen currency, the search, the manufacturers, a
// parameter for each filter of the Category, the price range, the picker's
// conditions, and the page. The Category and the currency are required, so
// that no page can forget to send them. The picker's conditions are in stock
// only, the Build so far, in `part` as reading a Build takes it, and the
// switch that keeps the Parts that are not Compatible with it; a Category
// page sends none of them.
export class ListVisiblePartsRequest extends PagingRequest {
  @CategoryAsked('The Category whose Visible Parts are listed.')
  readonly category!: string;

  @ChosenCurrencyAsked(
    "The chosen currency, which each Part's Lowest Price is in and the Parts are ordered by.",
  )
  readonly currency!: Currency;

  @ApiPropertyOptional({
    description:
      'Words a Part must hold, in any order and any case, in its name, its manufacturer or a part number. Left out or empty, every Visible Part of the Category is found.',
    example: 'ryzen 7600',
  })
  @IsOptional()
  @IsString()
  readonly search?: string;

  @ApiPropertyOptional({
    description:
      'Manufacturers, repeated for several: a Part of any of them is found. Left out, a Part of any manufacturer is.',
    type: [String],
    example: ['AMD', 'Intel'],
  })
  @IsOptional()
  @Transform(asAList)
  @IsString({ each: true })
  readonly manufacturer?: string[];

  @ApiPropertyOptional({
    description:
      "The price range's lowest end, in whole ones of the chosen currency, whole dollars or whole dinars, compared with each Lowest Price as answered and included. Given, a Part with no Lowest Price is left out. Refused when it is above the highest end.",
    type: 'integer',
    minimum: 0,
    example: 250000,
  })
  @IsOptional()
  @Matches(wholeNumber)
  readonly lowest?: string;

  @ApiPropertyOptional({
    description:
      "The price range's highest end, in whole ones of the chosen currency, compared with each Lowest Price as answered and included. Given, a Part with no Lowest Price is left out.",
    type: 'integer',
    minimum: 0,
    example: 500000,
  })
  @IsOptional()
  @Matches(wholeNumber)
  readonly highest?: string;

  @SwitchAsked(
    'In stock only, as the picker lists a Category (BLD-2): on, only the Visible Parts with at least one in-stock Visible Offer are listed, in the same order.',
  )
  readonly inStockOnly?: string;

  @BuildAsked(
    'The Build so far, as the picker lists a Category for it (BLD-3), taken as reading a Build takes it. Given, each Part answers whether it is Compatible with it. Left out, no Part answers it, as on a Category page.',
  )
  readonly part?: string[];

  @SwitchAsked(
    "The picker's switch (BLD-3): on, the Parts that are not Compatible with the Build are kept, in their place in the order, each answering that it is not. Off, they are left out. It changes nothing without a Build.",
  )
  readonly keepNotCompatible?: string;

  toQueryInput(): ListVisiblePartsQueryInput {
    // Each filter's parameter, as declared below, with the texts given it.
    const given = this as unknown as Record<string, string[] | undefined>;
    const filters = new Map<string, readonly string[]>();
    for (const parameter of filterParameters().keys()) {
      const texts = given[parameter];
      if (texts !== undefined) filters.set(parameter, texts);
    }

    return new ListVisiblePartsQueryInput(
      theCategoryAsked(this.category),
      this.currency,
      this.search ?? '',
      this.manufacturer ?? [],
      filters,
      this.lowest === undefined ? undefined : Number(this.lowest),
      this.highest === undefined ? undefined : Number(this.highest),
      new PickersConditions(
        isOn(this.inStockOnly),
        this.part ?? [],
        isOn(this.keepNotCompatible),
      ),
      this.toDomain(),
    );
  }
}

// Each Category's Parts, as the description names them in words.
const partsOf = new Map<Category, string>([
  [Category.CPU, 'CPUs'],
  [Category.CPU_COOLER, 'CPU coolers'],
  [Category.MOTHERBOARD, 'motherboards'],
  [Category.RAM, 'RAM'],
  [Category.STORAGE, 'storage'],
  [Category.GPU, 'GPUs'],
  [Category.CASE, 'cases'],
  [Category.PSU, 'PSUs'],
]);

// The type each kind of filter's values have in the description.
const typeOfKind: Record<FilterKind, 'integer' | 'string' | 'boolean'> = {
  number: 'integer',
  text: 'string',
  yesNo: 'boolean',
};

// A parameter for each filter, declared here from the filters' statement in
// `filters.ts`, which alone names them, so that the request takes them and
// the description lists them: a list of texts, repeated for several values.
// Whether the Category has the filter, and whether each value is of its
// kind, the use case decides, naming the parameter when it refuses it.
for (const [parameter, filters] of filterParameters()) {
  const target = ListVisiblePartsRequest.prototype;
  // Every parameter the class declares, its paging's among them, has its type
  // recorded by its decorators, so that a filter cannot take one's place.
  if (Reflect.hasMetadata('design:type', target, parameter)) {
    throw new Error(`A filter's parameter is already the list's own: ${parameter}`);
  }
  const ofCategories = filters
    .map((filter) => {
      const specification = filter.getSpecification();
      const category = filter.getCategory();
      return `for ${partsOf.get(category) ?? category.getKey()}, the ${specification.getLabel()} at \`${specification.getPath()}\``;
    })
    .join('; ');
  ApiPropertyOptional({
    description: `A filter: ${ofCategories}. Repeated for several values, a Part holding any of them is found, and a Part missing it is not. Refused for any other Category.`,
    type: typeOfKind[filters[0].getKind()],
    isArray: true,
  })(target, parameter);
  IsOptional()(target, parameter);
  Transform(asAList)(target, parameter);
  IsString({ each: true })(target, parameter);
}

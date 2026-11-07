import { NotValidError } from '@pcp/core';
import { Either, Option } from 'effect';

import { Category } from '../part/Category';
import { Specification, SpecificationKind } from './Specification';
import { specificationListOf } from './specification-lists';

// A value a filter offers, as a Part's document holds it: a whole number,
// text, or yes or no.
export type FilterValue = number | string | boolean;

const filterKinds = ['number', 'text', 'yesNo'] as const;

// The kind of value a filter offers.
export type FilterKind = (typeof filterKinds)[number];

// The kind of value each kind of specification a filter can be made of holds.
// A filter is a choice among single values, so a specification that holds a
// list is none (BRW-2).
const kindOfValue: Partial<Record<SpecificationKind, FilterKind>> = {
  wholeNumber: 'number',
  oneOf: 'text',
  text: 'text',
  yesNo: 'yesNo',
};

// One of a Category's filters on a Shopper's list of its Visible Parts: a
// specification of its list, named by its place in a Part's document as the
// list names it, and the parameter a request asks it by.
export class Filter {
  private constructor(
    private readonly category: Category,
    private readonly parameter: string,
    private readonly specification: Specification,
    private readonly kind: FilterKind,
  ) {}

  // The filter on the specification at the path of the Category's list, or
  // none when the list has no specification there, or has one that holds a
  // list, which a filter cannot choose among. The statement below names only
  // filters, and the filters' unit test proves it whole.
  static of(category: Category, parameter: string, path: string): Option.Option<Filter> {
    const specification = specificationListOf(category)
      .getSpecifications()
      .find((each) => each.getPath() === path);
    const kind = specification && kindOfValue[specification.getKind()];
    return specification === undefined || kind === undefined
      ? Option.none()
      : Option.some(new Filter(category, parameter, specification, kind));
  }

  static kinds(): readonly FilterKind[] {
    return filterKinds;
  }

  getCategory(): Category {
    return this.category;
  }

  getParameter(): string {
    return this.parameter;
  }

  getSpecification(): Specification {
    return this.specification;
  }

  getKind(): FilterKind {
    return this.kind;
  }

  // The value a request's text asks for, when it is one this filter's
  // specification could hold: a whole number in Western digits, `true` or
  // `false`, or text its specification takes. Anything else is none, and so
  // is a value that stands for "not known", which no Part holds as a value.
  read(text: string): Option.Option<FilterValue> {
    const value = this.parsed(text);
    if (value === undefined) return Option.none();
    const checked = this.specification.check(value);
    return checked.problems.length === 0 && checked.value !== undefined
      ? Option.some(checked.value as FilterValue)
      : Option.none();
  }

  private parsed(text: string): FilterValue | undefined {
    switch (this.kind) {
      case 'number': {
        const number = Number(text);
        return /^\d+$/.test(text) && Number.isSafeInteger(number) ? number : undefined;
      }
      case 'yesNo':
        return text === 'true' ? true : text === 'false' ? false : undefined;
      case 'text':
        return text;
    }
  }
}

// The values a request asks of one filter: a Part holding any of them
// matches it.
export class FilterChoice {
  constructor(
    private readonly filter: Filter,
    private readonly values: readonly FilterValue[],
  ) {}

  getFilter(): Filter {
    return this.filter;
  }

  getValues(): readonly FilterValue[] {
    return this.values;
  }
}

// The filters, written here once, for each of the eight Categories (BRW-2): a
// list of Visible Parts is narrowed by them, the Shopper app builds its form
// from the answer of their values, and no other place names them. Every
// Category is also filtered by its manufacturer, which is a Part's own and no
// specification, and by a range of Lowest Prices. A filter whose path its
// Category's list lacks is left out, and the API still starts (ADR-0004:
// domain code never throws); the filters' unit test proves that none is.
const statement = new Map<Category, readonly Filter[]>(
  (
    [
      [
        Category.CPU,
        [
          ['socket', 'socket'],
          ['cores', 'cores.total'],
        ],
      ],
      [
        Category.CPU_COOLER,
        [
          // Air or liquid.
          ['waterCooled', 'water_cooled'],
          ['radiatorSize', 'radiator_size'],
        ],
      ],
      [
        Category.MOTHERBOARD,
        [
          ['socket', 'socket'],
          ['formFactor', 'form_factor'],
          ['ramType', 'memory.ram_type'],
        ],
      ],
      [
        Category.RAM,
        [
          ['ramType', 'ram_type'],
          ['capacity', 'capacity'],
          ['speed', 'speed'],
        ],
      ],
      [
        Category.STORAGE,
        [
          // SSD or HDD.
          ['driveType', 'storage_type'],
          ['capacity', 'capacity'],
          ['interface', 'interface'],
        ],
      ],
      [
        Category.GPU,
        [
          ['chipset', 'chipset'],
          ['memory', 'memory'],
        ],
      ],
      [Category.CASE, [['formFactor', 'form_factor']]],
      [
        Category.PSU,
        [
          ['wattage', 'wattage'],
          ['efficiencyRating', 'efficiency_rating'],
        ],
      ],
    ] as const
  ).map(([category, filters]) => [
    category,
    filters.flatMap(([parameter, path]) =>
      Option.toArray(Filter.of(category, parameter, path)),
    ),
  ]),
);

// The Category's filters, in the order its form shows them.
export function filtersOf(category: Category): readonly Filter[] {
  return statement.get(category) ?? [];
}

// Every parameter any Category's filters are asked by, once, with the filters
// asked by it, for a request to declare. Filters of two Categories asked by
// the same parameter offer the same kind of value, so that the parameter has
// one kind whatever the Category, as the filters' unit test proves of the
// statement.
export function filterParameters(): ReadonlyMap<string, readonly Filter[]> {
  const byParameter = new Map<string, Filter[]>();
  for (const filter of [...statement.values()].flat()) {
    const same = byParameter.get(filter.getParameter()) ?? [];
    byParameter.set(filter.getParameter(), [...same, filter]);
  }
  return byParameter;
}

// A request's filter that is refused, naming its parameter: one the Category
// does not have, or a value that is not of its filter's kind.
function filterRefused(category: Category, parameter: string): NotValidError {
  return NotValidError.of(
    'NOT_VALID',
    `The ${category.getKey()} filter ${parameter} was refused`,
    { field: parameter },
  );
}

// The choices a request makes among a Category's filters, from the texts it
// gives each parameter, in the order of the Category's filters. A parameter
// the Category has no filter for, or a value that is not of its filter's
// kind, is refused, naming the parameter: the Shopper app asks only for what
// the answer of the Category's filters offered.
export function choicesOf(
  category: Category,
  asked: ReadonlyMap<string, readonly string[]>,
): Either.Either<readonly FilterChoice[], NotValidError> {
  const filters = filtersOf(category);
  const unknown = [...asked.keys()].find(
    (parameter) => !filters.some((filter) => filter.getParameter() === parameter),
  );
  if (unknown !== undefined) return Either.left(filterRefused(category, unknown));

  const choices: FilterChoice[] = [];
  for (const filter of filters) {
    const texts = asked.get(filter.getParameter());
    if (texts === undefined) continue;
    const values = texts.map((text) => filter.read(text));
    if (!values.every(Option.isSome)) {
      return Either.left(filterRefused(category, filter.getParameter()));
    }
    choices.push(
      new FilterChoice(
        filter,
        values.map((value) => value.value),
      ),
    );
  }
  return Either.right(choices);
}

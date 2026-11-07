import type { VisiblePartsFiltersResponse } from '@pcp/api-client';
import { type Language, westernDigitsIn, westernNumberIn } from '@pcp/i18n';

import { type Category, categoryAddress } from '@/entities/category';
import { pageInTheAddress } from '@/shared/lib';

// The query of a Category page's address, as Next hands it to the page: each
// parameter's value, or its values when it is repeated.
export type AddressQuery = Record<string, string | string[] | undefined>;

// What the API answers of a Category's filters (`GET v1/visible-parts/
// filters`): its Visible Parts' manufacturers, each of its filters with the
// values they hold, and the range of their Lowest Prices in the chosen
// currency. The form is built from it, and an address is read against it.
export type OfferedFilters = VisiblePartsFiltersResponse;

// A value a filter offers: a whole number, text, or yes or no.
export type FilterValue = OfferedFilters['filters'][number]['values'][number];

// The values chosen of one of the Category's filters, by the parameter the
// API asks it by. A Part holding any of them matches it.
export interface ChosenFilter {
  parameter: string;
  values: readonly FilterValue[];
}

// What a Category page's address asks of its list (the browse spec's The
// Shopper's addresses). The search, the filters and the page are in the
// address, so that the page can be reloaded, linked and shared.
export interface CategoryQuery {
  // The words a Part must hold, in its name, its manufacturer or a part
  // number, in any order, or nothing for every Visible Part of the Category.
  search: string;
  // The manufacturers chosen, in the order the Category offers them.
  manufacturers: readonly string[];
  // The filters with a value chosen, in the order the Category offers them,
  // each with its values in the order it offers them. Different filters must
  // all match.
  filters: readonly ChosenFilter[];
  // The price range's ends, whole numbers in the chosen currency, or null.
  lowest: number | null;
  highest: number | null;
  // The page of the list, counted from 1.
  page: number;
}

// The query with nothing on: the first page of every Visible Part of the
// Category, and the list that Clear all leads to.
export const nothingOn: CategoryQuery = {
  search: '',
  manufacturers: [],
  filters: [],
  lowest: null,
  highest: null,
  page: 1,
};

// The most digits a price range's end may have: the API reads each end
// exactly up to 15 of them, and refuses more. No price comes near.
const mostDigitsOfAnEnd = 15;

// A Category page's query, read from its address, against the API's answer
// of the Category's filters. The search, the manufacturers, the filters, the
// price range and the page are read, and nothing else: every other
// parameter is ignored. A parameter or a value that the Category's filters
// do not offer is dropped, never sent to the API, so that an old or mistyped
// link still opens its list. A filter's repeated parameter is read as its
// several values, each once; a search, a page or an end of the range repeated
// is read as its first. Digits are read whether a keyboard typed them as
// Western, Arabic-Indic or Eastern Arabic-Indic ones (`westernDigitsIn`).
//
// The search is read as its words, one space between each: the API finds
// every word in any order, in any case. A search of nothing but spaces is no
// search. The page is read as `pageInTheAddress` reads it, and the price
// range as `readPriceRange` reads it.
//
// Without the answer of the Category's filters nothing can be checked against
// what they offer, so only the search and the page are read.
export function readCategoryQuery(
  address: AddressQuery,
  offered?: OfferedFilters,
): CategoryQuery {
  const words = westernDigitsIn(firstOf(address.search))
    .split(/\s+/)
    .filter((word) => word !== '');
  const range = readPriceRange(address, offered);

  return {
    search: words.join(' '),
    manufacturers:
      offered === undefined
        ? []
        : chosenAmong(offered.manufacturers, address.manufacturer, (value) => value),
    filters:
      offered === undefined
        ? []
        : offered.filters.flatMap(({ parameter, values }) => {
            const chosen = chosenAmong(values, address[parameter], writtenValue);
            return chosen.length === 0 ? [] : [{ parameter, values: chosen }];
          }),
    lowest: range.lowest.value,
    highest: range.highest.value,
    page: pageInTheAddress(address.page),
  };
}

// The first value of a parameter, or nothing.
function firstOf(value: string | string[] | undefined): string {
  return [value].flat()[0] ?? '';
}

// The values offered that the address chose, in the order they are offered:
// each value the address holds is compared, in Western digits and without
// the spaces around it, with each offered value as the address writes it.
function chosenAmong<Value>(
  offered: readonly Value[],
  inTheAddress: string | string[] | undefined,
  written: (value: Value) => string,
): Value[] {
  const asked = new Set(
    [inTheAddress ?? []].flat().map((value) => westernDigitsIn(value).trim()),
  );
  return offered.filter((value) => asked.has(written(value)));
}

// A filter's value as an address writes it: text as it is, a number in
// Western digits with nothing between them, and yes or no as `true` or
// `false`, as the API reads them.
function writtenValue(value: FilterValue): string {
  return String(value);
}

// Why an end of a price range that was typed is not used: it is not a whole
// number; it has more digits than any price; or it is the lowest end and
// above the highest.
export type PriceProblem = 'notAWholeNumber' | 'tooLarge' | 'aboveTheHighest';

// One end of a price range as its field is filled in: what was typed,
// without the spaces around it; the whole number read from it, or null; and
// why it is not used, or null when it is, or when nothing was typed.
export interface PriceEnd {
  typed: string;
  value: number | null;
  problem: PriceProblem | null;
}

// A Category page's price range, read from its address: its two ends, whole
// numbers in the chosen currency, typed in Western, Arabic-Indic or Eastern
// Arabic-Indic digits, and read through the shared reading of digits, which
// drops the separators of thousands (`westernNumberIn`). An end that is not a
// whole number, or has more than 15 digits, is not used; nor is a lowest end
// above the highest, which alone is the mistake, as the API names it when it
// refuses such a range. What was typed is kept, so that the form shows it
// again beside what is wrong with it. A Category none of whose Visible Parts
// has a Lowest Price offers no range, so both ends are dropped, with nothing
// to say: the form shows no range to fill in.
export function readPriceRange(
  address: AddressQuery,
  offered?: OfferedFilters,
): { lowest: PriceEnd; highest: PriceEnd } {
  const inRange = offered?.priceRange.lowest != null;
  const lowest = readEnd(firstOf(address.lowest), inRange);
  const highest = readEnd(firstOf(address.highest), inRange);

  if (lowest.value !== null && highest.value !== null && lowest.value > highest.value) {
    return { lowest: { ...lowest, value: null, problem: 'aboveTheHighest' }, highest };
  }
  return { lowest, highest };
}

function readEnd(text: string, inRange: boolean): PriceEnd {
  const typed = text.trim();
  if (typed === '' || !inRange) return { typed, value: null, problem: null };

  const digits = westernNumberIn(typed);
  if (!/^\d+$/.test(digits)) return { typed, value: null, problem: 'notAWholeNumber' };
  const significant = digits.replace(/^0+(?=\d)/, '');
  if (significant.length > mostDigitsOfAnEnd) {
    return { typed, value: null, problem: 'tooLarge' };
  }
  return { typed, value: Number(significant), problem: null };
}

// A Category page's address, in a language, written from a query: the
// search, the manufacturers, each filter's values, the price range's ends and
// then the page, each only when it asks for something, so that the first page
// with nothing on is the Category page's own address. A filter with several
// values repeats its parameter. Numbers are written in Western digits, and
// the search as it was read. What is written reads back as the same query.
export function categoryPageAddress(
  language: Language,
  category: Category,
  { search, manufacturers, filters, lowest, highest, page }: CategoryQuery,
): string {
  const query = new URLSearchParams();
  if (search !== '') query.append('search', search);
  for (const manufacturer of manufacturers) query.append('manufacturer', manufacturer);
  for (const { parameter, values } of filters) {
    for (const value of values) query.append(parameter, writtenValue(value));
  }
  if (lowest !== null) query.append('lowest', String(lowest));
  if (highest !== null) query.append('highest', String(highest));
  if (page > 1) query.append('page', String(page));
  const written = query.toString();

  return `${categoryAddress(language, category)}${written === '' ? '' : `?${written}`}`;
}

// A choice that is on, which the Shopper can clear on its own (DESIGN.md's
// The choices that are on), with the query of the list without it, from its
// first page.
export type ChoiceOn = (
  | { kind: 'search'; search: string }
  | { kind: 'manufacturer'; manufacturer: string }
  | { kind: 'filter'; parameter: string; value: FilterValue }
  | { kind: 'price'; lowest: number | null; highest: number | null }
) & { without: CategoryQuery };

// The choices that are on, in the order of the address: the search's words,
// each manufacturer, each value of each filter, and the price range, its two
// ends one choice. Clearing all of them at once is `nothingOn`.
export function choicesOn(query: CategoryQuery): ChoiceOn[] {
  const fromTheFirstPage = { ...query, page: 1 };
  const choices: ChoiceOn[] = [];

  if (query.search !== '') {
    choices.push({
      kind: 'search',
      search: query.search,
      without: { ...fromTheFirstPage, search: '' },
    });
  }
  for (const manufacturer of query.manufacturers) {
    choices.push({
      kind: 'manufacturer',
      manufacturer,
      without: {
        ...fromTheFirstPage,
        manufacturers: query.manufacturers.filter((each) => each !== manufacturer),
      },
    });
  }
  for (const { parameter, values } of query.filters) {
    for (const value of values) {
      choices.push({
        kind: 'filter',
        parameter,
        value,
        without: {
          ...fromTheFirstPage,
          filters: query.filters.flatMap((filter) => {
            if (filter.parameter !== parameter) return [filter];
            const left = filter.values.filter((each) => each !== value);
            return left.length === 0 ? [] : [{ parameter, values: left }];
          }),
        },
      });
    }
  }
  if (query.lowest !== null || query.highest !== null) {
    choices.push({
      kind: 'price',
      lowest: query.lowest,
      highest: query.highest,
      without: { ...fromTheFirstPage, lowest: null, highest: null },
    });
  }
  return choices;
}

// The address the filters' form is sent to with script, which applies a
// choice as soon as it is made: the fields the form holds, in their order, a
// repeated parameter in each of its places, as a browser sends a form with
// GET, but for the fields left empty, so that the address holds only what is
// on. What was typed is kept as it was typed, without the spaces around it:
// the page reads it, as it reads an address the form sent without script,
// and says why beside a field what it cannot use. The page's own number is
// not sent, so a new choice starts again at the list's first page.
export function addressOfTheForm(
  action: string,
  fields: readonly (readonly [string, string])[],
): string {
  const query = new URLSearchParams();
  for (const [name, value] of fields) {
    if (value.trim() !== '') query.append(name, value.trim());
  }
  const written = query.toString();

  return `${action}${written === '' ? '' : `?${written}`}`;
}

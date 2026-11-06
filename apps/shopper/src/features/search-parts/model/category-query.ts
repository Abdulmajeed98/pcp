import { type Language, westernDigitsIn } from '@pcp/i18n';

import { type Category, categoryAddress } from '@/entities/category';

// The query of a Category page's address, as Next hands it to the page: each
// parameter's value, or its values when it is repeated.
export type AddressQuery = Record<string, string | string[] | undefined>;

// What a Category page's address asks of its list (the browse spec's The
// Shopper's addresses). Its search and its page are in the address, so that
// the page can be reloaded, linked and shared.
export interface CategoryQuery {
  // The words a Part must hold, in its name, its manufacturer or a part
  // number, in any order, or nothing for every Visible Part of the Category.
  search: string;
  // The page of the list, counted from 1.
  page: number;
}

// The last page an address can name. The API pages a list to its page
// 1,000,000, counted from 0 (`PagingRequest`), and refuses one past it; no
// list has that many pages, so this one is past the last page of every list.
const lastPageTheApiPagesTo = 1_000_001;

// A Category page's query, read from its address. The search and the page are
// read, and nothing else: every other parameter is ignored. A repeated one is
// read as its first value. Digits are read whether a keyboard typed them as
// Western, Arabic-Indic or Eastern Arabic-Indic ones (`westernDigitsIn`).
//
// The search is read as its words, one space between each: the API finds
// every word in any order, in any case. A search of nothing but spaces is no
// search. A page that is not a whole number from 1, such as 0 or 2.5, is read
// as the first, so that an old or mistyped link still opens the list.
export function readCategoryQuery(query: AddressQuery): CategoryQuery {
  const words = westernDigitsIn(firstOf(query.search))
    .split(/\s+/)
    .filter((word) => word !== '');
  const page = westernDigitsIn(firstOf(query.page)).trim();

  return {
    search: words.join(' '),
    page: /^\d+$/.test(page)
      ? Math.min(Math.max(Number(page), 1), lastPageTheApiPagesTo)
      : 1,
  };
}

function firstOf(value: string | string[] | undefined): string {
  return [value].flat()[0] ?? '';
}

// A Category page's address, in a language, written from a query: the search
// and then the page, each only when it asks for something, so that the first
// page with no search is the Category page's own address. The page is
// written in Western digits, and the search as it was read. What is written
// reads back as the same query.
export function categoryPageAddress(
  language: Language,
  category: Category,
  { search, page }: CategoryQuery,
): string {
  const query = new URLSearchParams();
  if (search !== '') query.set('search', search);
  if (page > 1) query.set('page', String(page));
  const written = query.toString();

  return `${categoryAddress(language, category)}${written === '' ? '' : `?${written}`}`;
}

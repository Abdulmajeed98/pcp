import { westernDigitsIn } from '@pcp/i18n';

// The last page an address can name. The API pages a list to its page
// 1,000,000, counted from 0 (`PagingRequest`), and refuses one past it; no
// list has that many pages, so this one is past the last page of every list.
const lastPageTheApiPagesTo = 1_000_001;

// The page of a list an address names, `page` in its query, counted from 1
// as "Page 2 of 17" counts it: a Category page's list and a Vendor page's
// Offers are each paged in the address, so that the page can be reloaded,
// linked and shared. Its digits are read whether a keyboard typed them as
// Western, Arabic-Indic or Eastern Arabic-Indic ones (`westernDigitsIn`). A
// page repeated is read as its first, and one that is not a whole number
// from 1, such as 0 or 2.5, as the first page, so that an old or mistyped
// link still opens its list. A page past the last the API pages to is read
// as that last, which is past the end of every list.
export function pageInTheAddress(value: string | string[] | undefined): number {
  const page = westernDigitsIn([value].flat()[0] ?? '').trim();
  return /^\d+$/.test(page)
    ? Math.min(Math.max(Number(page), 1), lastPageTheApiPagesTo)
    : 1;
}

// A page of a list as the API answers one, as far as what its sheet shows
// is told by: how many the whole list holds, how many pages it has, and what
// the page holds.
interface AnsweredPage {
  totalElements: number;
  totalPages: number;
  content: readonly unknown[];
}

// What a sheet that lists a page of something shows: the page, or why it
// lists nothing.
export type PageShown<Page> =
  | { kind: 'listed'; page: Page }
  | { kind: 'none' }
  | { kind: 'past-the-end'; totalPages: number }
  | { kind: 'not-read' };

// What a sheet that lists a page of something shows, from the page the API
// answered (DESIGN.md's The empty states, and a Vendor's Offers): the page,
// when it holds some; that there is none to show, when the whole list holds
// nothing; how many pages the list has, when the page asked is past its
// last, as an old link may ask; and that the list cannot be read, when the
// API did not answer it. A Category's sheet tells its empty list apart
// further, by whether the Shopper's choices emptied it.
export function whatAPageShows<Page extends AnsweredPage>(
  page: Page | undefined,
): PageShown<Page> {
  if (page === undefined) return { kind: 'not-read' };
  if (page.totalElements === 0) return { kind: 'none' };
  if (page.content.length === 0)
    return { kind: 'past-the-end', totalPages: page.totalPages };
  return { kind: 'listed', page };
}

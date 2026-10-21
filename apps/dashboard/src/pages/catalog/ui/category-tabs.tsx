import { formatNumber } from '@pcp/i18n';
import { Link, useLocation } from 'react-router';

import { type CategoryKey, categoryName, useCategories } from '@/entities/category';
import { useMoreBeyondTheEnd } from '@/shared/lib';

import { useCountsByCategory } from '../api/search-parts';
import { type CatalogSearch, addressOf } from '../model/search';

// The Catalog's Categories as its tabs (DESIGN.md's Tabs): All Categories
// first, then the eight in the API's order, each with how many Parts the
// search finds in it, in Note Grey, "CPU 791", so that the Admin sees where
// the results are before choosing. They stand on a full-width Edge rule; the
// current one is in Ink at weight 600 with a 2-pixel Bazaar Teal line as wide
// as its label. Each is a link to the same search in that Category, from its
// first page, so a reload or the back button keeps it. On a phone, and
// beside an opened Part, they scroll sideways in their own row, which fades
// at its end side while more tabs lie beyond it. The line moves to the
// chosen tab at once.
export function CategoryTabs({ search }: { search: CatalogSearch }) {
  const categories = useCategories();
  const keys = categories.data?.map(({ key }) => key) ?? [];
  const counts = useCountsByCategory(search.words, keys);
  const { pathname } = useLocation();
  const [row, moreBeyond] = useMoreBeyondTheEnd<HTMLElement>();

  const tabs: { category: CategoryKey | undefined; name: string }[] = [
    { category: undefined, name: 'All Categories' },
    ...keys.map((key) => ({ category: key, name: categoryName(key) })),
  ];

  return (
    <nav
      ref={row}
      aria-label="Categories"
      data-more-beyond={moreBeyond ? '' : undefined}
      className="fade-end -mx-4 overflow-x-auto overscroll-x-contain px-4 lg:mx-0 lg:px-0"
    >
      <ul className="flex min-w-max gap-5 border-b border-border">
        {tabs.map(({ category, name }) => {
          const current = category === search.category;
          const count = counts.get(category);
          return (
            <li key={category ?? 'all'} className="flex">
              <Link
                to={{
                  pathname,
                  search: addressOf({ words: search.words, category, page: 0 }),
                }}
                aria-current={current ? 'page' : undefined}
                className="group/tab hover-colour flex min-h-control items-stretch text-sm whitespace-nowrap text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 aria-[current=page]:text-foreground"
              >
                <span className="relative flex items-center gap-1.5 after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 group-aria-[current=page]/tab:font-semibold group-aria-[current=page]/tab:after:bg-tab-line">
                  {name}{' '}
                  {count !== undefined && (
                    <span className="font-normal text-muted-foreground tabular-nums">
                      {formatNumber(count)}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

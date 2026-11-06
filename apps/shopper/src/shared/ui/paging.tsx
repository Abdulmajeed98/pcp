import { formatNumber } from '@pcp/i18n';
import { cn } from 'cn';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import { buttonVariants } from './button';

// An arrow along the reading direction: forward to the end side, the right
// in English, or back to the start side, and so mirrored in Kurdish and
// Arabic. It is drawn, since none of the page's faces draws an arrow, and is
// hidden from readers, the link's words saying where it leads.
function Arrow({ to }: { to: 'start' | 'end' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={cn(
        'size-4 shrink-0',
        to === 'start' ? 'rtl:-scale-x-100' : 'ltr:-scale-x-100',
      )}
    >
      <path
        d="M14 8 H2 M7 3 L2 8 L7 13"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="square"
      />
    </svg>
  );
}

// Paging (DESIGN.md's Paging), at the foot of a sheet whose list is paged, a
// Category's Parts or a Vendor's Offers, above its closing lines: "Page 2 of
// 17" in the middle in Small Soft Ink, and Previous page and Next page as two
// cells of the Board, 52 pixels tall, on the start and the end sides, each a
// link to its page's address, `addressOf` the page counted from 1; the first
// page has no Previous and the last none Next, and a list of one page says
// "Page 1 of 1" alone. On a narrow sheet the page's place takes a line of
// its own above the two cells, each as wide as its words, so that neither
// wraps. With script the list is drawn again in place, shown printed.
export async function Paging({
  page,
  totalPages,
  addressOf,
}: {
  page: number;
  totalPages: number;
  addressOf: (page: number) => string;
}) {
  const t = await getTranslations('Paging');
  const pageOf = (
    <span data-testid="page-of" className="text-center text-sm text-muted-foreground">
      {t('pageOf', { page: formatNumber(page), pages: formatNumber(totalPages) })}
    </span>
  );
  if (totalPages <= 1) return <p className="mt-12 text-center">{pageOf}</p>;

  const cell = buttonVariants({ kind: 'board', className: 'gap-2 px-3' });

  return (
    <div className="@container mt-12">
      <nav
        aria-label={t('pages')}
        data-testid="paging"
        className="grid grid-cols-[auto_auto] items-center justify-between gap-2 @[34rem]:grid-cols-[1fr_auto_1fr]"
      >
        <span className="col-span-2 text-center @[34rem]:order-2 @[34rem]:col-span-1">
          {pageOf}
        </span>
        <span className="justify-self-start @[34rem]:order-1">
          {page > 1 && (
            <Link href={addressOf(page - 1)} prefetch={false} rel="prev" className={cell}>
              <Arrow to="start" />
              {t('previousPage')}
            </Link>
          )}
        </span>
        <span className="justify-self-end @[34rem]:order-3">
          {page < totalPages && (
            <Link href={addressOf(page + 1)} prefetch={false} rel="next" className={cell}>
              {t('nextPage')}
              <Arrow to="end" />
            </Link>
          )}
        </span>
      </nav>
    </div>
  );
}

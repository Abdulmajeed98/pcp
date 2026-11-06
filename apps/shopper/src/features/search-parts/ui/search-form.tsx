'use client';

import type { PriceRangeResponse } from '@pcp/api-client';
import { useRouter, useSearchParams } from 'next/navigation';
import { type ReactNode, useEffect, useId, useRef, useTransition } from 'react';

import { addressOfTheForm, readPriceRange } from '../model/category-query';

// The words the form is drawn with, in the page's language.
export interface SearchFormWords {
  title: string;
  label: string;
  placeholder: string;
}

// A Category page's search and filters (DESIGN.md's The swing tag, The search
// and The filters): one plain form sent with GET to the Category page's own
// address, so that it works before any script has loaded, its choices
// landing in the address, where a reload, a link or a friend finds them
// again. A new search or choice starts again at the list's first page, as
// the form sends no page.
//
// From 64rem it is the swing tag beside the sheet, Sheet Paper with its
// punched hole, its title, "Filters", centred, and its fields 24 pixels
// apart: the search first, then the filters (`children`), with Show Parts
// and Clear all at its foot. Below 64rem the search is a field of its own
// above the sheet, always in sight, and the filters fold behind a bar under
// it. The search's field is 48 pixels tall, on the Bone Ground on the tag's
// paper and on Sheet Paper where it lies on the ground itself, with a
// 3-pixel line in the Ink along its foot, the line of a form filled in by
// hand, and its words never under 16 pixels, so that a phone does not zoom
// into it. It takes the direction of what is typed in it, so that a long
// English search on a Kurdish page shows its start.
//
// With script the form is applied in place, its address written by
// `addressOfTheForm`, and the page's list is drawn again, shown printed:
//
// - a chip applies as soon as it is ticked or cleared, and the fold stays
//   as it is, so that the next chip is a tap away;
// - Enter in the search, or the keyboard's search key, sends the form, and
//   on a touchscreen lets go of the keyboard, so that the list is in sight;
// - Show Parts, or Enter in a field of the price range, sends it, folds the
//   tag and brings the list's head into view, the focus with it, unless a
//   typed price cannot be used: the tag then stays open, so that what the
//   form says beside that field is seen.
//
// What the page is drawn with afterwards is shown in the fields, unless the
// Shopper is typing in one: a choice cleared elsewhere on the page clears its
// chip, and a price read from Arabic-Indic digits shows in Western ones.
export function SearchForm({
  action,
  search,
  priceRange,
  words,
  className,
  children,
}: {
  action: string;
  search: string;
  priceRange: PriceRangeResponse | null;
  words: SearchFormWords;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [applying, startApplying] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  const searchField = useRef<HTMLInputElement>(null);
  const title = useId();
  const drawnWith = useSearchParams().toString();

  useEffect(() => {
    if (applying || form.current === null) return;
    for (const field of form.current.querySelectorAll('input')) {
      if (field.type === 'checkbox') field.checked = field.defaultChecked;
      else if (document.activeElement !== field) field.value = field.defaultValue;
    }
  }, [drawnWith, applying]);

  // The form's fields as they are filled in now, as the browser would send
  // them.
  const fieldsOf = (filled: HTMLFormElement) =>
    [...new FormData(filled)].map(([name, value]) => [name, String(value)] as const);

  const apply = (filled: HTMLFormElement) => {
    const address = addressOfTheForm(action, fieldsOf(filled));
    startApplying(() => router.push(address, { scroll: false }));
  };

  // Whether a typed end of the price range cannot be used, which the page
  // drawn next says beside its field.
  const aPriceCannotBeUsed = (filled: HTMLFormElement) => {
    if (priceRange === null) return false;
    const typed = new FormData(filled);
    const { lowest, highest } = readPriceRange(
      {
        lowest: String(typed.get('lowest') ?? ''),
        highest: String(typed.get('highest') ?? ''),
      },
      { manufacturers: [], filters: [], priceRange },
    );
    return lowest.problem !== null || highest.problem !== null;
  };

  // Folds the tag, on a phone, and brings the head of the list into view,
  // with the focus, which would otherwise be lost in the folded tag.
  const showTheList = (filled: HTMLFormElement) => {
    const fold = filled.querySelector('details');
    if (fold !== null) fold.open = false;
    const sheet = document.querySelector<HTMLElement>('[data-testid="sheet"]');
    const head = sheet?.querySelector<HTMLElement>('h1');
    if (head !== null && head !== undefined) {
      head.tabIndex = -1;
      head.focus({ preventScroll: true });
    }
    sheet?.scrollIntoView({ block: 'start', behavior: 'instant' });
  };

  return (
    <search aria-labelledby={title} data-testid="search" className={className}>
      <form
        ref={form}
        action={action}
        method="get"
        data-testid="filters"
        onChange={(event) => {
          const changed = event.target;
          if (changed instanceof HTMLInputElement && changed.type === 'checkbox') {
            apply(event.currentTarget);
          }
        }}
        onSubmit={(event) => {
          event.preventDefault();
          const filled = event.currentTarget;
          const typing = document.activeElement;
          apply(filled);
          if (typing === searchField.current) {
            if (matchMedia('(pointer: coarse)').matches) searchField.current?.blur();
          } else if (!aPriceCannotBeUsed(filled)) {
            showTheList(filled);
          }
        }}
        className="grid gap-2.5 lg:gap-6 lg:punched-hole lg:bg-card lg:px-8 lg:pt-14 lg:pb-8 lg:text-card-foreground"
      >
        <p id={title} className="type-sheet-title hidden text-center lg:block">
          {words.title}
        </p>
        <label className="grid">
          <span className="sr-only">{words.label}</span>
          <input
            ref={searchField}
            type="search"
            name="search"
            dir="auto"
            defaultValue={search}
            placeholder={words.placeholder}
            enterKeyHint="search"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="min-h-input w-full appearance-none rounded-none border-0 border-b-[3px] border-input bg-card px-3 text-base text-foreground placeholder:text-muted-foreground lg:bg-background"
          />
        </label>
        {children}
      </form>
    </search>
  );
}

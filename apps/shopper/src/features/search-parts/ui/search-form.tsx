'use client';

import Form from 'next/form';
import { useEffect, useRef } from 'react';

import { buttonVariants } from '@/shared/ui';

// The words the form is drawn with, in the page's language.
export interface SearchFormWords {
  title: string;
  label: string;
  placeholder: string;
  show: string;
}

// A Category page's search (DESIGN.md's The search): a plain form sent with
// GET to the Category page's own address, so that it works before any script
// has loaded, the search landing in the address, where a reload, a link or
// a friend finds it again. A new search starts again at the list's first
// page, as the form sends no page.
//
// From 64rem it is the swing tag beside the sheet, Sheet Paper with its
// punched hole, its title centred and its fields 24 pixels apart, with Show
// Parts, the primary button, at its foot. Below 64rem it is a field of its
// own above the sheet, always in sight, and the keyboard's search key sends
// it. The field is 48 pixels tall, on the Bone Ground on the tag's paper and
// on Sheet Paper where it lies on the ground itself, with a 3-pixel line in
// the Ink along its foot, the line of a form filled in by hand, and its
// words never under 16 pixels, so that a phone does not zoom into it.
//
// With script, Next's form applies the search in place: the page's list is
// drawn again, shown printed, and the field keeps what was typed. On a
// touchscreen the field then lets go of the keyboard, so that the list is in
// sight. A search changed elsewhere on the page, as when it is cleared, is
// shown in the field, unless the Shopper is typing in it.
export function SearchForm({
  action,
  search,
  words,
  className,
}: {
  action: string;
  search: string;
  words: SearchFormWords;
  className?: string;
}) {
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const typedIn = field.current;
    if (typedIn !== null && document.activeElement !== typedIn) typedIn.value = search;
  }, [search]);

  return (
    <search aria-label={words.label} data-testid="search" className={className}>
      <Form
        action={action}
        prefetch={false}
        onSubmit={() => {
          if (matchMedia('(pointer: coarse)').matches) field.current?.blur();
        }}
        className="grid gap-6 lg:punched-hole lg:bg-card lg:px-8 lg:pt-14 lg:pb-8 lg:text-card-foreground"
      >
        <p aria-hidden="true" className="type-sheet-title hidden text-center lg:block">
          {words.title}
        </p>
        <label className="grid">
          <span className="sr-only">{words.label}</span>
          <input
            ref={field}
            type="search"
            name="search"
            defaultValue={search}
            placeholder={words.placeholder}
            enterKeyHint="search"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="min-h-input w-full appearance-none rounded-none border-0 border-b-[3px] border-input bg-card px-3 text-base text-foreground placeholder:text-muted-foreground lg:bg-background"
          />
        </label>
        <button
          type="submit"
          className={buttonVariants({
            kind: 'primary',
            className: 'hidden w-full lg:inline-flex',
          })}
        >
          {words.show}
        </button>
      </Form>
    </search>
  );
}

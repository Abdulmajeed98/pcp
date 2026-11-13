'use client';

import { useSearchParams } from 'next/navigation';
import { useLayoutEffect, useRef } from 'react';

import { markDrawnAgain } from './drawn-again';

// A page drawn again in place is shown printed (DESIGN.md's When a movement
// plays): with script, a search or another page of a list changes the page's
// query and its rows in place, and its sheet does not print again, nor do
// the new rows' prices settle. The page's sheet stays the same element, so
// it does not print again by itself; the rows are new, so the document is
// marked drawn again (`markDrawnAgain`) once the query differs from the one
// the page was first drawn with, after the new rows are put in and before
// they are painted, and the theme then shows every piece as it is. A page opened anew, the language and currency
// switches' among them, is a new document, and prints. It draws nothing.
export function MarkADrawingAgain() {
  const query = useSearchParams().toString();
  const drawnWith = useRef(query);

  useLayoutEffect(() => {
    if (query !== drawnWith.current) markDrawnAgain();
  }, [query]);

  return null;
}

import { useEffect, useState } from 'react';

// A row of a list as the screen draws it: the item, its key, and whether it
// is leaving: a row the list no longer holds, kept in its place for as long
// as it takes to leave (the dashboard's DESIGN.md, Motion 8).
export interface ShownRow<Item> {
  item: Item;
  key: string;
  leaving: boolean;
}

interface Leaving<Item> {
  item: Item;
  key: string;
  // Where it stood in the list it left.
  index: number;
}

// How long a row takes to leave: its fade, 150 ms, then its space closing,
// 200 ms, and a frame to spare.
const leavingFor = 400;

// The rows of a list answered in pages, with the rows it dropped while the
// user was on it kept in their places, marked as leaving, until they have
// left. A row leaves only when the same page is answered again without it,
// as after a Part's gaps are filled or a Vendor's Offers are confirmed; a
// different page, or the first answer, is drawn as it is, still, as paging
// is (Motion 9). A leaving row that the next answer holds again is no longer
// leaving, and comes back from wherever its leaving had reached.
export function useLeavingRows<Item>(
  items: readonly Item[],
  keyOf: (item: Item) => string,
  page: number,
): ShownRow<Item>[] {
  const [drawn, setDrawn] = useState({ items, page, leaving: [] as Leaving<Item>[] });

  if (drawn.items !== items || drawn.page !== page) {
    const held = new Set(items.map(keyOf));
    const samePage = drawn.page === page;
    const stillLeaving = samePage
      ? drawn.leaving.filter((leaving) => !held.has(leaving.key))
      : [];
    const dropped = samePage
      ? drawn.items.flatMap((item, index) => {
          const key = keyOf(item);
          return held.has(key) ? [] : [{ item, key, index }];
        })
      : [];
    setDrawn({ items, page, leaving: [...stillLeaving, ...dropped] });
  }

  const { leaving } = drawn;
  useEffect(() => {
    if (leaving.length === 0) return;
    const gone = setTimeout(
      () => setDrawn((now) => (now.leaving === leaving ? { ...now, leaving: [] } : now)),
      leavingFor,
    );
    return () => clearTimeout(gone);
  }, [leaving]);

  const shown: ShownRow<Item>[] = drawn.items.map((item) => ({
    item,
    key: keyOf(item),
    leaving: false,
  }));
  for (const { item, key, index } of [...leaving].sort((a, b) => a.index - b.index)) {
    shown.splice(Math.min(index, shown.length), 0, { item, key, leaving: true });
  }
  return shown;
}

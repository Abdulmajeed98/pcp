import { useCallback, useEffect, useState } from 'react';

// A row of a list as the screen draws it: the item, its key, whether it is
// leaving (a row the list no longer holds, kept in its place until it has
// left) or arriving (a row new to the same page, which opens its space and
// fades in), and what it calls once its space has closed (the dashboard's
// DESIGN.md, Motion 8).
export interface ShownRow<Item> {
  item: Item;
  key: string;
  leaving: boolean;
  arriving: boolean;
  // Called by the row when its space has closed, at the end of its
  // `grid-template-rows` transition, so that it is taken out only then.
  left: () => void;
}

interface Leaving<Item> {
  item: Item;
  key: string;
  // Where it stood in the list it left.
  index: number;
}

interface Drawn<Item> {
  items: readonly Item[];
  page: number;
  leaving: Leaving<Item>[];
  arriving: ReadonlySet<string>;
}

// A leaving row is taken out when its space has closed. Should that never
// be told (a transition that does not run), it is taken out after this
// long, longer than its leaving at a quarter of its speed.
const atTheLatest = 3000;

// The rows of a list answered in pages, with the rows it dropped while the
// user was on it kept in their places, marked as leaving, until their space
// has closed, and the rows new to it marked as arriving. Rows leave and
// arrive only when the same page is answered again; a different page, or
// the first answer, is drawn as it is, still, as paging is (Motion 9). A
// leaving row that the next answer holds again is no longer leaving, and
// comes back from wherever its leaving had reached.
export function useLeavingRows<Item>(
  items: readonly Item[],
  keyOf: (item: Item) => string,
  page: number,
): ShownRow<Item>[] {
  const [drawn, setDrawn] = useState<Drawn<Item>>({
    items,
    page,
    leaving: [],
    arriving: new Set(),
  });

  if (drawn.items !== items || drawn.page !== page) {
    const held = new Set(items.map(keyOf));
    const samePage = drawn.page === page && drawn.items.length > 0;
    const wasDrawn = new Set([
      ...drawn.items.map(keyOf),
      ...drawn.leaving.map((leaving) => leaving.key),
    ]);
    setDrawn({
      items,
      page,
      leaving: samePage
        ? [
            ...drawn.leaving.filter((leaving) => !held.has(leaving.key)),
            ...drawn.items.flatMap((item, index) => {
              const key = keyOf(item);
              return held.has(key) ? [] : [{ item, key, index }];
            }),
          ]
        : [],
      arriving: samePage
        ? new Set([...held].filter((key) => !wasDrawn.has(key)))
        : new Set(),
    });
  }

  const left = useCallback((key: string) => {
    setDrawn((now) =>
      now.leaving.some((leaving) => leaving.key === key)
        ? { ...now, leaving: now.leaving.filter((leaving) => leaving.key !== key) }
        : now,
    );
  }, []);

  const { leaving } = drawn;
  useEffect(() => {
    if (leaving.length === 0) return;
    const late = setTimeout(
      () => setDrawn((now) => (now.leaving === leaving ? { ...now, leaving: [] } : now)),
      atTheLatest,
    );
    return () => clearTimeout(late);
  }, [leaving]);

  const shown: ShownRow<Item>[] = drawn.items.map((item) => {
    const key = keyOf(item);
    return { item, key, leaving: false, arriving: drawn.arriving.has(key), left: () => {} };
  });
  for (const { item, key, index } of [...leaving].sort((a, b) => a.index - b.index)) {
    shown.splice(Math.min(index, shown.length), 0, {
      item,
      key,
      leaving: true,
      arriving: false,
      left: () => left(key),
    });
  }
  return shown;
}

// What a leaving row listens to, so that it is taken out once its space has
// closed: the end of the `grid-template-rows` transition of its own or of
// one of its cells.
export function whenTheSpaceHasClosed(
  row: ShownRow<unknown>,
): ((event: { propertyName: string }) => void) | undefined {
  if (!row.leaving) return undefined;
  return (event) => {
    if (event.propertyName === 'grid-template-rows') row.left();
  };
}

import { useState } from 'react';

// One item a list shows, and whether it is leaving: it is no longer in the
// list's answer, and stays where it was until it has left (DESIGN.md's
// Motion, 8).
export interface Shown<Item> {
  item: Item;
  leaving: boolean;
}

// The items of a list as the screen shows them: the answer's, in its order,
// with each item the list has dropped since the last answer kept where it
// stood, marked as leaving, until `left` is told it has left. Only an item
// dropped from the same list leaves: an answer to another search, state or
// page, named by `list`, replaces what was shown at once, as changing what
// is listed is still (Motion, 9).
export function useWithTheLeaving<Item>(
  items: readonly Item[],
  keyOf: (item: Item) => string,
  list: string,
): [readonly Shown<Item>[], (key: string) => void] {
  const [shown, setShown] = useState<readonly Shown<Item>[]>(() => arriving(items));
  const [answered, setAnswered] = useState({ items, list });

  if (items !== answered.items || list !== answered.list) {
    setAnswered({ items, list });
    setShown(
      list === answered.list ? keepingTheLeaving(shown, items, keyOf) : arriving(items),
    );
  }

  function left(key: string): void {
    setShown((now) => now.filter((each) => !(each.leaving && keyOf(each.item) === key)));
  }

  return [shown, left];
}

function arriving<Item>(items: readonly Item[]): Shown<Item>[] {
  return items.map((item) => ({ item, leaving: false }));
}

// The answer's items in its order, with each item shown before that it no
// longer holds put back after the item it followed, marked as leaving.
function keepingTheLeaving<Item>(
  before: readonly Shown<Item>[],
  items: readonly Item[],
  keyOf: (item: Item) => string,
): Shown<Item>[] {
  const staying = new Set(items.map(keyOf));
  // The leaving items, by the key of the staying item each followed, the
  // empty key for those before every staying item.
  const after = new Map<string, Shown<Item>[]>();
  let anchor = '';
  for (const each of before) {
    const key = keyOf(each.item);
    if (staying.has(key)) {
      anchor = key;
      continue;
    }
    after.set(anchor, [...(after.get(anchor) ?? []), { item: each.item, leaving: true }]);
  }

  const shown: Shown<Item>[] = [...(after.get('') ?? [])];
  for (const item of items) {
    shown.push({ item, leaving: false }, ...(after.get(keyOf(item)) ?? []));
  }
  return shown;
}

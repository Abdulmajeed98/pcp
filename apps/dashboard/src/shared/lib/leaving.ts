import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

// The one way the dashboard keeps something on the screen until its leaving
// has been seen (the dashboard's DESIGN.md, Motion 8, and the No Snap Rule):
// a row a list dropped, an entry taken out of a form, a refusal cleared, a
// banner with nothing left to say, an older photo under a newer one. Each
// is marked as leaving, the theme's `leaves` closes its space (or a fade
// covers it), and it is taken out once that transition has ended, whatever
// its speed, or at the latest after `atTheLatest`, should the transition
// never end (a transition that does not run, as when the browser had not
// drawn its start, ends nothing). Content that changes in place, the
// Platform Rate's board and `ChangingInPlace`, leaves by a movement of the
// Web Animations API instead, and is taken out once that has finished, by
// the same rule and with the same fallback (`useKeptWhileChanging`).

// How long a leaving thing waits at most for its transition to end: longer
// than any leaving watched four times slower.
export const atTheLatest = 3000;

// A transition's end, as the element listening to it is told.
export interface Ended {
  propertyName: string;
  target: EventTarget;
  currentTarget: EventTarget;
}

// Whether a transition that ended was the close of the space of the element
// listening: `grid-template-rows` ended on the element itself, or, for a
// table's row, which cannot be a grid, on what one of its own cells holds.
export function spaceClosed({ propertyName, target, currentTarget }: Ended): boolean {
  if (propertyName !== 'grid-template-rows') return false;
  if (target === currentTarget) return true;
  const cell = target instanceof Element ? target.parentElement : null;
  return cell?.localName === 'td' && cell.parentElement === currentTarget;
}

// The things now on their way out, by key, each taken out by `takeOut` once
// it is done with, as the function this answers is told of its key, or after
// `atTheLatest`. Several done with in one frame are taken out together in the
// next one, such as every row of a list made not known. `takeOut` may be
// told of a key again, and of one already gone, and does nothing then.
export function useTakenOutOnceDone<Key>(
  leaving: readonly Key[],
  takeOut: (keys: Key[]) => void,
): (key: Key) => void {
  const latest = useRef(takeOut);
  useLayoutEffect(() => {
    latest.current = takeOut;
  });

  const waiting = useRef<Key[]>([]);
  const done = useCallback((key: Key) => {
    if (waiting.current.includes(key)) return;
    waiting.current.push(key);
    if (waiting.current.length > 1) return;
    requestAnimationFrame(() => {
      const keys = waiting.current;
      waiting.current = [];
      latest.current(keys);
    });
  }, []);

  // When each began to leave, so that its last moment holds however often
  // the screen is drawn meanwhile.
  const since = useRef(new Map<Key, number>());
  useEffect(() => {
    const now = Date.now();
    for (const key of since.current.keys()) {
      if (!leaving.includes(key)) since.current.delete(key);
    }
    const timers = leaving.map((key) => {
      if (!since.current.has(key)) since.current.set(key, now);
      const left = atTheLatest - (now - (since.current.get(key) ?? now));
      return setTimeout(() => done(key), Math.max(0, left));
    });
    return () => timers.forEach(clearTimeout);
  });

  return done;
}

// The same, for things that leave by a CSS transition: each is taken out once
// the transition that `ended` recognises has ended on its element (the
// listener that `whenEnded(key)` gives it), or after `atTheLatest`.
export function useTakenOutOnceEnded<Key>(
  leaving: readonly Key[],
  takeOut: (keys: Key[]) => void,
  ended: (event: Ended) => boolean = spaceClosed,
): (key: Key) => (event: Ended) => void {
  const done = useTakenOutOnceDone(leaving, takeOut);
  return useCallback(
    (key: Key) => (event: Ended) => {
      if (ended(event)) done(key);
    },
    [done, ended],
  );
}

// What was shown for a key, such as a figure or which state a screen is in.
export interface Kept<Value> {
  key: string;
  value: Value;
}

// What was shown before a change, kept while it leaves, by the order the
// changes came in.
export interface KeptLeaving<Value> extends Kept<Value> {
  id: number;
}

// Content that changes in place: what is shown for a key that changes, and
// what was shown for each key before it, still on its way out, the newest
// last, as the Platform Rate's board tile and `ChangingInPlace` keep them. A
// new key, seen while rendering, starts what was shown leaving, as React lets
// a component adjust its state to its props; the value for a key is taken as
// it was first given for it. `left(id)` is told once a leaving one's own
// movement has run, and takes it out with every one that began to leave
// before it, which it has covered; each is taken out after `atTheLatest`
// should its movement never finish.
export function useKeptWhileChanging<Value>(
  key: string,
  value: Value,
): {
  shown: Kept<Value>;
  leaving: readonly KeptLeaving<Value>[];
  left: (id: number) => void;
} {
  const [kept, setKept] = useState<{
    shown: Kept<Value>;
    leaving: KeptLeaving<Value>[];
    changes: number;
  }>({ shown: { key, value }, leaving: [], changes: 0 });
  if (key !== kept.shown.key) {
    setKept({
      shown: { key, value },
      leaving: [...kept.leaving, { ...kept.shown, id: kept.changes }],
      changes: kept.changes + 1,
    });
  }

  const left = useTakenOutOnceDone(
    kept.leaving.map(({ id }) => id),
    (ids) => {
      const newest = Math.max(...ids);
      setKept((now) =>
        now.leaving.some(({ id }) => id <= newest)
          ? { ...now, leaving: now.leaving.filter(({ id }) => id > newest) }
          : now,
      );
    },
  );
  return { shown: kept.shown, leaving: kept.leaving, left };
}

// What a thing that comes and goes in place is marked with: whether it is
// leaving, whether it is arriving, and what it listens to while it leaves.
export interface Moving {
  leaving: boolean;
  arriving: boolean;
  onTransitionEnd?: (event: Ended) => void;
}

// The attributes the theme's `leaves` reads, and the listener, for the
// element that comes and goes: a leaving one takes no tap.
export function movingProps({ leaving, arriving, onTransitionEnd }: Moving) {
  return {
    'data-leaving': leaving || undefined,
    'data-arriving': (arriving && !leaving) || undefined,
    inert: leaving,
    onTransitionEnd,
  };
}

// One thing shown while there is something to show: the last value given,
// kept while it leaves once there is none (null), and taken out once its
// space has closed. Given a value again while it leaves, it comes back from
// where it is.
export function useKeptUntilClosed<Value>(
  value: Value | null,
): { kept: Value | null } & Moving {
  const [kept, setKept] = useState<Value | null>(value);
  if (value !== null && value !== kept) setKept(value);
  const leaving = kept !== null && value === null;
  const whenEnded = useTakenOutOnceEnded(leaving ? [0] : [], () =>
    setKept((now) => (value === null ? null : now)),
  );
  return {
    kept,
    leaving,
    arriving: false,
    onTransitionEnd: leaving ? whenEnded(0) : undefined,
  };
}

// A row of a list as the screen draws it: the item, its key, and whether it
// is leaving (a row the list no longer holds, kept in its place until its
// space has closed) or arriving (a row new to the same page, which opens its
// space and fades in), with what it listens to while it leaves.
export interface ShownRow<Item> extends Moving {
  item: Item;
  key: string;
}

interface Left<Item> {
  item: Item;
  key: string;
  // Where it stood in the list it left.
  index: number;
}

interface Drawn<Item> {
  items: readonly Item[];
  page: number;
  leaving: Left<Item>[];
  arriving: ReadonlySet<string>;
}

// The rows of a list answered in pages, with the rows it dropped while the
// user was on it kept in their places, marked as leaving, until their space
// has closed, and the rows new to it marked as arriving. Rows leave and
// arrive only when the same page is answered again; a different page, or
// the first answer, is drawn as it is, still, as paging is (Motion 9). A
// leaving row that the next answer holds again is no longer leaving, and
// comes back from wherever its leaving had reached. Each row takes
// `movingProps(row)`.
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

  const { leaving } = drawn;
  const whenEnded = useTakenOutOnceEnded(
    leaving.map(({ key }) => key),
    (keys) =>
      setDrawn((now) =>
        now.leaving.some(({ key }) => keys.includes(key))
          ? { ...now, leaving: now.leaving.filter(({ key }) => !keys.includes(key)) }
          : now,
      ),
  );

  const shown: ShownRow<Item>[] = drawn.items.map((item) => {
    const key = keyOf(item);
    return { item, key, leaving: false, arriving: drawn.arriving.has(key) };
  });
  for (const { item, key, index } of [...leaving].sort((a, b) => a.index - b.index)) {
    shown.splice(Math.min(index, shown.length), 0, {
      item,
      key,
      leaving: true,
      arriving: false,
      onTransitionEnd: whenEnded(key),
    });
  }
  return shown;
}

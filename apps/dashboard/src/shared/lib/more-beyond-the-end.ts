import { type RefCallback, useCallback, useState } from 'react';

// Whether a row that scrolls sideways has more of itself beyond its end
// side, the right in English and the left in Kurdish and Arabic, so that it
// can fade there until it is scrolled to its end. It is asked again when the
// row is scrolled and when it or its content changes size.
export function useMoreBeyondTheEnd<Row extends HTMLElement>(): [
  RefCallback<Row>,
  boolean,
] {
  const [moreBeyond, setMoreBeyond] = useState(false);

  const ref = useCallback((row: Row | null) => {
    if (row === null) return;
    // In right to left a row's scroll position counts down from 0, so its
    // distance from the start is the position's size either way.
    const measure = () =>
      setMoreBeyond(Math.abs(row.scrollLeft) + row.clientWidth < row.scrollWidth - 1);
    measure();
    row.addEventListener('scroll', measure, { passive: true });
    const resized = new ResizeObserver(measure);
    resized.observe(row);
    if (row.firstElementChild !== null) resized.observe(row.firstElementChild);
    return () => {
      row.removeEventListener('scroll', measure);
      resized.disconnect();
    };
  }, []);

  return [ref, moreBeyond];
}

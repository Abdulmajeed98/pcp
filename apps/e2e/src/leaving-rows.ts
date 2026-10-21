import type { Page } from '@playwright/test';

// A row a list was seen dropping while the user was on it, as the page drew
// it the moment it was marked as leaving: its text, whether it still takes a
// tap, and each transition of its own and of what it holds, one property at
// a time (the dashboard's DESIGN.md, Motion 8).
export interface LeavingRow {
  text: string;
  inert: boolean;
  transitions: { property: string; duration: string; delay: string }[];
}

// Starts watching the page for rows marked as leaving (`data-leaving`), and
// keeps what each looked like when it was marked. Rows leave in a few
// hundred milliseconds, so the page records them itself rather than the test
// looking for them.
export async function watchForLeavingRows(page: Page): Promise<void> {
  await page.evaluate(() => {
    const seen: LeavingRow[] = [];
    (window as unknown as { leavingRows: LeavingRow[] }).leavingRows = seen;

    const record = (row: HTMLElement) => {
      const transitions: LeavingRow['transitions'] = [];
      for (const element of [row, ...row.querySelectorAll<HTMLElement>('*')]) {
        const style = getComputedStyle(element);
        const properties = style.transitionProperty.split(', ');
        const durations = style.transitionDuration.split(', ');
        const delays = style.transitionDelay.split(', ');
        properties.forEach((property, index) => {
          if (property === 'all' || property === 'none') return;
          transitions.push({
            property,
            duration: durations[index % durations.length],
            delay: delays[index % delays.length],
          });
        });
      }
      seen.push({ text: row.textContent ?? '', inert: row.inert, transitions });
    };

    new MutationObserver((records) => {
      for (const { type, target, addedNodes } of records) {
        if (type === 'attributes' && target instanceof HTMLElement) {
          if (target.hasAttribute('data-leaving')) record(target);
        }
        for (const node of addedNodes) {
          if (node instanceof HTMLElement && node.hasAttribute('data-leaving')) {
            record(node);
          }
        }
      }
    }).observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-leaving'],
    });
  });
}

// The rows seen leaving since `watchForLeavingRows`.
export async function leavingRowsOf(page: Page): Promise<LeavingRow[]> {
  return page.evaluate(
    () => (window as unknown as { leavingRows: LeavingRow[] }).leavingRows,
  );
}

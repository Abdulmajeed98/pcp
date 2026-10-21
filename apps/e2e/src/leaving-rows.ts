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

// One frame of a list as the page drew it: each row, by the first words of
// its text, with where it is, how high, and how opaque its first link is
// drawn (its own opacity times its ancestors'); where the pages' navigation
// is; and where each column heading starts.
export interface DrawnFrame {
  at: number;
  rows: { key: string; top: number; height: number; opacity: number }[];
  pages: number | null;
  headings: number[];
}

// Records the list named `name` at every frame the page draws while `act`
// runs and for `forMs` after it, with every animation and transition of the
// page slowed by `slowedBy` (DevTools' own playback rate), so that a step
// that a person would see at full speed is seen frame by frame.
export async function filmTheList(
  page: Page,
  name: string,
  act: () => Promise<void>,
  { slowedBy, forMs }: { slowedBy: number; forMs: number },
): Promise<DrawnFrame[]> {
  const devtools = await page.context().newCDPSession(page);
  await devtools.send('Animation.enable');
  await devtools.send('Animation.setPlaybackRate', { playbackRate: 1 / slowedBy });
  await page.evaluate((listName) => {
    const frames: DrawnFrame[] = [];
    const film = window as unknown as { film: { frames: DrawnFrame[]; on: boolean } };
    film.film = { frames, on: true };
    const opacityOf = (element: Element | null) => {
      let opacity = 1;
      for (let at = element; at !== null && at !== document.body; at = at.parentElement) {
        opacity *= Number(getComputedStyle(at).opacity);
      }
      return opacity;
    };
    const draw = () => {
      const list = document.querySelector(
        `table[aria-label="${listName}"] tbody, ul[aria-label="${listName}"]`,
      );
      const rows = [...(list?.children ?? [])].map((row) => {
        const box = row.getBoundingClientRect();
        return {
          key: (row.textContent ?? '').trim().slice(0, 24),
          top: box.top,
          height: box.height,
          opacity: opacityOf(row.querySelector('a')),
        };
      });
      const pages = document.querySelector(`nav[aria-label="Pages of the ${listName}"]`);
      frames.push({
        at: performance.now(),
        rows,
        pages: pages?.getBoundingClientRect().top ?? null,
        headings: [...document.querySelectorAll(`table[aria-label="${listName}"] th`)].map(
          (heading) => heading.getBoundingClientRect().left,
        ),
      });
      if (film.film.on) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }, name);
  await act();
  await page.waitForTimeout(forMs);
  const frames = await page.evaluate(() => {
    const film = (window as unknown as { film: { frames: DrawnFrame[]; on: boolean } })
      .film;
    film.on = false;
    return film.frames;
  });
  await devtools.send('Animation.setPlaybackRate', { playbackRate: 1 });
  await devtools.detach();
  return frames;
}

// What jumps between one frame and the next, at most `step` pixels a frame
// for a row's place or height or the pages' navigation, and at most
// `fade` of a row's opacity: a row that appears or disappears whole, a row
// that can still be seen or still takes room when it is taken out or put in
// (a table's collapsed rule lends a closed row half a pixel on each side,
// which no one sees), anything else that moves by a pixel in the frame a
// row is taken out or put in, and a column heading that moves. Empty when
// nothing jumps.
export function jumpsIn(
  frames: DrawnFrame[],
  { step, fade }: { step: number; fade: number },
): string[] {
  const jumps: string[] = [];
  frames.slice(1).forEach((frame, index) => {
    const before = frames[index];
    const at = `frame ${index + 1}`;
    const keys = (drawn: DrawnFrame) => drawn.rows.map((row) => row.key).join('|');
    const takenOutOrPutIn = keys(frame) !== keys(before);
    const most = takenOutOrPutIn ? 1 : step;
    for (const row of frame.rows) {
      const was = before.rows.find((each) => each.key === row.key);
      if (was === undefined) {
        if (row.height > 1 || row.opacity > 0.01) {
          jumps.push(`${at}: "${row.key}" appeared ${row.height}px high at ${row.opacity}`);
        }
        continue;
      }
      if (Math.abs(row.top - was.top) > most) {
        jumps.push(`${at}: "${row.key}" moved ${row.top - was.top}px`);
      }
      if (Math.abs(row.height - was.height) > most) {
        jumps.push(`${at}: "${row.key}" changed height by ${row.height - was.height}px`);
      }
      if (Math.abs(row.opacity - was.opacity) > fade) {
        jumps.push(`${at}: "${row.key}" changed opacity by ${row.opacity - was.opacity}`);
      }
    }
    for (const was of before.rows) {
      if (frame.rows.some((row) => row.key === was.key)) continue;
      if (was.height > 1 || was.opacity > 0.01) {
        jumps.push(
          `${at}: "${was.key}" was taken out ${was.height}px high at ${was.opacity}`,
        );
      }
    }
    if (
      frame.pages !== null &&
      before.pages !== null &&
      Math.abs(frame.pages - before.pages) > most
    ) {
      jumps.push(`${at}: the pages moved ${frame.pages - before.pages}px`);
    }
    if (
      frame.headings.some(
        (left, column) => Math.abs(left - (before.headings[column] ?? left)) > 0.5,
      )
    ) {
      jumps.push(`${at}: a column heading moved`);
    }
  });
  return jumps;
}

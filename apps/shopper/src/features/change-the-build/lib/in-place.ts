// What the Build page's script moves when a change applies in place (DESIGN.md's
// Motion 11), in the browser alone. A line the Build gains or loses is an
// element marked `data-line` with a name of its own; a figure the change may
// alter is one marked `data-figure`. Each duration is the theme's token, so
// that the stylesheet and the script keep one time.

const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';

// A duration of the theme's, in milliseconds, as `--unfold` gives it.
function durationOf(token: string): number {
  const written = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  const milliseconds = Number.parseFloat(written);
  return written.endsWith('ms') || !written.endsWith('s')
    ? milliseconds
    : milliseconds * 1000;
}

function motionIsReduced(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// The space a line takes, opening from nothing to its own height or folding
// to nothing, so that what is below it moves rather than jumps: 250 ms to
// open and 150 to fold, and 150 each way with reduced motion. Its contents
// are clipped while it moves.
function moveTheSpace(element: HTMLElement, from: number, to: number, ms: number) {
  element.style.overflow = 'clip';
  const space = element.animate([{ height: `${from}px` }, { height: `${to}px` }], {
    duration: ms,
    easing: easeOut,
    fill: to === 0 ? 'forwards' : 'none',
  });
  return space;
}

// A line the Build loses: it fades in 100 ms, then its space folds in 150 ms,
// an exit faster than an arrival; with reduced motion it does not fade, and
// its space still folds. What is given back cancels both, for a change that
// did not reach the server, so that the line is shown again.
export function leave(elements: readonly HTMLElement[]): {
  done: Promise<void>;
  cancel: () => void;
} {
  const running: Animation[] = [];
  const done = Promise.all(
    elements.map(async (element) => {
      if (!motionIsReduced()) {
        const fade = element.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: durationOf('--leave'),
          fill: 'forwards',
        });
        running.push(fade);
        await fade.finished;
      }
      const height = element.getBoundingClientRect().height;
      const fold = moveTheSpace(element, height, 0, durationOf('--fold'));
      running.push(fold);
      await fold.finished;
    }),
  ).then(() => undefined);
  return {
    done,
    cancel: () => {
      for (const animation of running) animation.cancel();
      for (const element of elements) element.style.overflow = '';
    },
  };
}

// What the page held before a change was sent: the names of its lines, each
// figure's text, and whether the slip was stamped.
export interface Held {
  lines: Set<string>;
  figures: Map<string, string>;
}

export function whatIsHeld(container: HTMLElement): Held {
  return {
    lines: new Set(
      [...container.querySelectorAll<HTMLElement>('[data-line]')].map(
        (element) => element.dataset.line ?? '',
      ),
    ),
    figures: new Map(
      [...container.querySelectorAll<HTMLElement>('[data-figure]')].map((element) => [
        element.dataset.figure ?? '',
        element.textContent ?? '',
      ]),
    ),
  };
}

// Once the page is drawn again from the server's answer, before it is
// painted: each line it gains opens its space and, with motion, prints in;
// each figure the change altered settles again. A space opens from the
// height it has, so a second change before the first has finished goes on
// from there.
export function showWhatArrived(container: HTMLElement, before: Held): void {
  const reduced = motionIsReduced();
  for (const element of container.querySelectorAll<HTMLElement>('[data-line]')) {
    if (before.lines.has(element.dataset.line ?? '')) continue;
    // The stamp lies on its paper and takes no space: it lands.
    if (element.hasAttribute('data-lands')) {
      if (!reduced) printIn(element);
      continue;
    }
    const height = element.getBoundingClientRect().height;
    const space = moveTheSpace(
      element,
      0,
      height,
      durationOf(reduced ? '--fold' : '--unfold'),
    );
    void space.finished.then(() => {
      element.style.overflow = '';
    });
    if (!reduced) printIn(element);
  }
  if (reduced) return;
  for (const element of container.querySelectorAll<HTMLElement>('[data-figure]')) {
    const was = before.figures.get(element.dataset.figure ?? '');
    if (was !== undefined && was !== element.textContent) settleAgain(element);
  }
}

// Marks what the theme moves once, and takes the mark off when it ends, so
// that the next change can play it again.
function marked(element: HTMLElement, mark: string): void {
  element.removeAttribute(mark);
  void element.offsetWidth;
  element.setAttribute(mark, '');
  // A price inside a line settles on its own clock: only the element's own
  // movement takes the mark off.
  const ended = (event: AnimationEvent) => {
    if (event.target !== element) return;
    element.removeAttribute(mark);
    element.removeEventListener('animationend', ended);
  };
  element.addEventListener('animationend', ended);
}

function printIn(element: HTMLElement): void {
  marked(element, 'data-arrived');
}

function settleAgain(element: HTMLElement): void {
  marked(element, 'data-settles-again');
}

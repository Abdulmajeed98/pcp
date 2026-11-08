// What the Build page's script moves when a change applies in place (DESIGN.md's
// Motion 11), in the browser alone. A line the Build gains or loses is an
// element marked `data-line` with a name of its own; a space whose height a
// change may alter, a Category's place, the status or the slip's lines, is
// marked `data-space`; a figure the change may alter is marked
// `data-figure`. Each duration is the theme's token, so that the stylesheet
// and the script keep one time.

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

// A space moving from one height to another, its contents clipped while it
// moves, so that what is below it moves rather than jumps: 250 ms to open
// and 150 to fold, and 150 each way with reduced motion.
function moveTheSpace(element: HTMLElement, from: number, to: number): Animation {
  const ms = durationOf(to > from && !motionIsReduced() ? '--unfold' : '--fold');
  element.style.overflow = 'clip';
  const space = element.animate([{ height: `${from}px` }, { height: `${to}px` }], {
    duration: ms,
    easing: easeOut,
    fill: to === 0 ? 'forwards' : 'none',
  });
  if (to !== 0) {
    void space.finished
      .then(() => {
        element.style.overflow = '';
      })
      .catch(() => {});
  }
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
      const fold = moveTheSpace(element, element.getBoundingClientRect().height, 0);
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

// What the page held before a change was sent: the names of its lines, the
// height of each space, and each figure's text.
export interface Held {
  lines: Set<string>;
  spaces: Map<string, number>;
  figures: Map<string, string>;
}

export function whatIsHeld(container: HTMLElement): Held {
  const all = (mark: string) => [...container.querySelectorAll<HTMLElement>(`[${mark}]`)];
  return {
    lines: new Set(all('data-line').map((element) => element.dataset.line ?? '')),
    spaces: new Map(
      all('data-space').map((element) => [
        element.dataset.space ?? '',
        element.getBoundingClientRect().height,
      ]),
    ),
    figures: new Map(
      all('data-figure').map((element) => [
        element.dataset.figure ?? '',
        element.textContent ?? '',
      ]),
    ),
  };
}

// Once the page is drawn again from the server's answer, before it is
// painted: each space the change made taller or shorter, such as a Category
// whose Part became a cell to choose one, moves from the height it had to
// its own, so that nothing below jumps (the No Snap Rule); and, with motion,
// each line it gains prints in, the stamp lands, and each figure it altered
// settles again.
export function showWhatArrived(container: HTMLElement, before: Held): void {
  const all = (mark: string) => [...container.querySelectorAll<HTMLElement>(`[${mark}]`)];
  for (const element of all('data-space')) {
    const was = before.spaces.get(element.dataset.space ?? '');
    const now = element.getBoundingClientRect().height;
    if (was !== undefined && Math.abs(was - now) > 0.5) moveTheSpace(element, was, now);
  }
  if (motionIsReduced()) return;
  for (const element of all('data-line')) {
    if (!before.lines.has(element.dataset.line ?? '')) marked(element, 'data-arrived');
  }
  for (const element of all('data-figure')) {
    const was = before.figures.get(element.dataset.figure ?? '');
    if (was !== undefined && was !== element.textContent) {
      marked(element, 'data-settles-again');
    }
  }
}

// Marks what the theme moves once, and takes the mark off when its own
// movement ends, so that the next change can play it again. A price inside a
// line settles on its own clock, so only the element's own movement counts.
function marked(element: HTMLElement, mark: string): void {
  element.removeAttribute(mark);
  void element.offsetWidth;
  element.setAttribute(mark, '');
  const ended = (event: AnimationEvent) => {
    if (event.target !== element) return;
    element.removeAttribute(mark);
    element.removeEventListener('animationend', ended);
  };
  element.addEventListener('animationend', ended);
}

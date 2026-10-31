import type { Locator, Page } from '@playwright/test';

// One frame of a film: when the page drew it, by its own clock, and what the
// film's `look` saw in it.
export interface Filmed<Frame> {
  at: number;
  drawn: Frame;
}

// Films the page: calls `look` in the page at every frame the page draws
// while `act` runs and for `forMs` after it, with every animation and
// transition slowed by `slowedBy` (DevTools' own playback rate), so that a
// step a person would see at full speed is seen frame by frame (the No Snap
// Rule, redesign ticket 10). `look` runs in the page, so it can use only
// what it is given, `arg`, and the page's own globals. Every film of the
// dashboard's motion is taken with it.
export async function film<Frame, Arg = undefined>(
  page: Page,
  look: (arg: Arg) => Frame,
  act: () => Promise<void>,
  {
    slowedBy = 4,
    forMs = 1600,
    arg,
  }: { slowedBy?: number; forMs?: number; arg?: Arg } = {},
): Promise<Filmed<Frame>[]> {
  const devtools = await page.context().newCDPSession(page);
  await devtools.send('Animation.enable');
  await devtools.send('Animation.setPlaybackRate', { playbackRate: 1 / slowedBy });
  const looking = await page.evaluateHandle(`(${look.toString()})`);
  try {
    await page.evaluate(
      ([lookAt, given]) => {
        const reel = { frames: [] as { at: number; drawn: unknown }[], on: true };
        (window as unknown as { reel: typeof reel }).reel = reel;
        const draw = () => {
          reel.frames.push({
            at: performance.now(),
            drawn: (lookAt as unknown as (arg: unknown) => unknown)(given),
          });
          if (reel.on) requestAnimationFrame(draw);
        };
        requestAnimationFrame(draw);
      },
      [looking, arg] as const,
    );
    await act();
    await page.waitForTimeout(forMs);
    return (await page.evaluate(() => {
      const { reel } = window as unknown as {
        reel: { frames: unknown[]; on: boolean };
      };
      reel.on = false;
      return reel.frames;
    })) as Filmed<Frame>[];
  } finally {
    await looking.dispose();
    await devtools.send('Animation.setPlaybackRate', { playbackRate: 1 });
    await devtools.detach();
  }
}

// Where each filmed element was drawn in one frame, in the page's own
// coordinates (a scroll moves none of them), by the name it was filmed by.
export type FilmedPlaces = Record<string, { left: number; top: number } | null>;

// Films where each of `filmed` is drawn (used for a Part's screens in
// ticket 08, and for the forms after it). An element the page replaces while
// it is filmed is lost, so film what stays.
export async function filmPlaces(
  page: Page,
  filmed: Record<string, Locator>,
  act: () => Promise<void>,
  options: { slowedBy?: number; forMs?: number } = {},
): Promise<Filmed<FilmedPlaces>[]> {
  for (const [name, locator] of Object.entries(filmed)) {
    await locator.evaluate((element, as) => element.setAttribute('data-filmed', as), name);
  }
  return film(
    page,
    () => {
      const places: Record<string, { left: number; top: number }> = {};
      for (const element of document.querySelectorAll('[data-filmed]')) {
        const box = element.getBoundingClientRect();
        places[element.getAttribute('data-filmed') ?? ''] = {
          left: box.left + window.scrollX,
          top: box.top + window.scrollY,
        };
      }
      return places;
    },
    act,
    options,
  );
}

// How far one filmed element travelled in all, along its path (down and back
// up again counts twice), on either axis.
export function travelOf(frames: Filmed<FilmedPlaces>[], name: string): number {
  const places = frames.map(({ drawn }) => drawn[name]).filter((place) => place != null);
  return places.slice(1).reduce((moved, place, index) => {
    const before = places[index];
    return (
      moved + Math.max(Math.abs(place.top - before.top), Math.abs(place.left - before.left))
    );
  }, 0);
}

// The fastest a movement may go in a film slowed four times, in pixels a
// millisecond between two drawn frames, as ticket 11's films judged it: a
// 300-pixel space closing smoothly over a slowed 800 ms stays well under it.
export const fastestSmooth = 6;

// What snaps in one value followed through a film, such as an element's top:
// each run of frames in which it moves is a movement, and a movement of more
// than a few pixels whose largest step is over half of it, or which goes
// faster than `fastest` pixels a millisecond between two drawn frames, is a
// snap (the No Snap Rule). A step is judged against its own movement, since
// a 300-pixel space closing smoothly takes larger steps than a 20-pixel line
// snapping, and its speed by the time between the frames drawn, so that
// frames the page drops while it is busy do not make a smooth movement look
// like a snap. Ticket 11's films judged so first. Empty when nothing snaps.
export function snapsOf(
  name: string,
  values: { at: number; value: number | null }[],
  { fastest = fastestSmooth }: { fastest?: number } = {},
): string[] {
  const snaps: string[] = [];
  let run: { step: number; speed: number }[] = [];
  const judge = () => {
    const whole = run.reduce((sum, { step }) => sum + Math.abs(step), 0);
    const largest = Math.max(0, ...run.map(({ step }) => Math.abs(step)));
    const quickest = Math.max(0, ...run.map(({ speed }) => speed));
    if (whole > 4 && largest > whole / 2) {
      snaps.push(
        `${name} moved ${Math.round(largest)}px of its ${Math.round(whole)}px in one frame`,
      );
    } else if (whole > 4 && quickest > fastest) {
      snaps.push(`${name} moved at ${quickest.toFixed(2)}px a millisecond`);
    }
    run = [];
  };
  values.slice(1).forEach(({ at, value }, index) => {
    const before = values[index];
    if (value === null || before.value === null) return judge();
    const step = value - before.value;
    if (Math.abs(step) < 0.5) return judge();
    run.push({ step, speed: Math.abs(step) / Math.max(1, at - before.at) });
  });
  judge();
  return snaps;
}

// What snaps in where one filmed element is drawn, down and across.
export function snapsOfThePlace(
  frames: Filmed<FilmedPlaces>[],
  name: string,
  options: { fastest?: number } = {},
): string[] {
  const along = (axis: 'top' | 'left') =>
    frames.map(({ at, drawn }) => ({ at, value: drawn[name]?.[axis] ?? null }));
  return [
    ...snapsOf(`${name}'s top`, along('top'), options),
    ...snapsOf(`${name}'s left`, along('left'), options),
  ];
}

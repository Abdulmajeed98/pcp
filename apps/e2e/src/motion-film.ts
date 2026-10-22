import type { Locator, Page } from '@playwright/test';

// Where each filmed element was drawn in one frame, in the page's own
// coordinates (a scroll moves none of them), by the name it was filmed by.
export type FilmedFrame = Record<string, { left: number; top: number } | null>;

// Records where each of `filmed` is drawn at every frame the page draws while
// `act` runs and for `forMs` after it, with every animation and transition
// slowed by `slowedBy` (DevTools' own playback rate), so that a step a person
// would see at full speed is seen frame by frame (the No Snap Rule, redesign
// ticket 10; used for a Part's screens in ticket 08). An element the page
// replaces while it is filmed is lost, so film what stays.
export async function filmPlaces(
  page: Page,
  filmed: Record<string, Locator>,
  act: () => Promise<void>,
  { slowedBy = 4, forMs = 1600 }: { slowedBy?: number; forMs?: number } = {},
): Promise<FilmedFrame[]> {
  for (const [name, locator] of Object.entries(filmed)) {
    await locator.evaluate((element, as) => element.setAttribute('data-filmed', as), name);
  }
  const devtools = await page.context().newCDPSession(page);
  await devtools.send('Animation.enable');
  await devtools.send('Animation.setPlaybackRate', { playbackRate: 1 / slowedBy });
  await page.evaluate(() => {
    const film = window as unknown as { places: { frames: FilmedFrame[]; on: boolean } };
    film.places = { frames: [], on: true };
    const draw = () => {
      const frame: FilmedFrame = {};
      for (const element of document.querySelectorAll('[data-filmed]')) {
        const box = element.getBoundingClientRect();
        frame[element.getAttribute('data-filmed') ?? ''] = {
          left: box.left + window.scrollX,
          top: box.top + window.scrollY,
        };
      }
      film.places.frames.push(frame);
      if (film.places.on) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  });
  await act();
  await page.waitForTimeout(forMs);
  const frames = await page.evaluate(() => {
    const film = (window as unknown as { places: { frames: FilmedFrame[]; on: boolean } })
      .places;
    film.on = false;
    return film.frames;
  });
  await devtools.send('Animation.setPlaybackRate', { playbackRate: 1 });
  await devtools.detach();
  return frames;
}

// The most an element may move between two frames, filmed four times slower,
// for a movement of `moved` pixels in all: a sixth of it, or 8 pixels for a
// short one. The motion's curves run at most about five times their mean
// speed at their fastest (the in-out curve in its middle, the out curve at
// its start), so a smooth movement stays inside this, while a snap moves all
// or most of the way in one frame (the No Snap Rule).
export function aFrameAtMost(moved: number): number {
  return Math.max(8, moved / 6);
}

// How far one filmed element travelled in all, along its path (down and back
// up again counts twice), and the most it moved between one frame and the
// next, on either axis.
export function travelOf(
  frames: FilmedFrame[],
  name: string,
): { moved: number; mostInAFrame: number } {
  const places = frames.map((frame) => frame[name]).filter((place) => place != null);
  let mostInAFrame = 0;
  let moved = 0;
  places.slice(1).forEach((place, index) => {
    const before = places[index];
    const step = Math.max(
      Math.abs(place.top - before.top),
      Math.abs(place.left - before.left),
    );
    mostInAFrame = Math.max(mostInAFrame, step);
    moved += step;
  });
  return { moved, mostInAFrame };
}

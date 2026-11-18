import type { Locator, Page } from '@playwright/test';

// A note that a screen shows after something was done, such as a request
// sent or resolved, is announced by a screen reader only when it arrives in
// a live region that was in the page before it: one that comes with the
// region, as when the screen it is on is drawn with it, is read as part of
// the page and not announced. A screen reader alone can tell that it is
// announced, which waits for hosting; these tell that the region, an
// `output`, was in the page with nothing to say before the note arrived.

interface WithTheRegionsRecorded {
  wordsAtArrival: (region: Element) => string | undefined;
}

// From the page's first script on, records what each live region held, as
// a screen reader reads it, when it was put into the page: its text,
// without what is hidden from the accessibility tree (`aria-hidden`,
// `inert`) or not drawn. Call it before the page is opened.
export async function recordTheLiveRegionsAsTheyArrive(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const wordsAtArrival = new WeakMap<Element, string>();
    (window as unknown as WithTheRegionsRecorded).wordsAtArrival = (region) =>
      wordsAtArrival.get(region);
    const read = (region: HTMLElement): string => {
      const copy = region.cloneNode(true) as HTMLElement;
      for (const hidden of copy.querySelectorAll('[aria-hidden="true"], [inert]')) {
        hidden.remove();
      }
      return region.innerText.trim() === '' ? '' : (copy.textContent ?? '').trim();
    };
    new MutationObserver(() => {
      for (const region of document.querySelectorAll('output')) {
        if (!wordsAtArrival.has(region) && region instanceof HTMLElement) {
          wordsAtArrival.set(region, read(region));
        }
      }
    }).observe(document, { childList: true, subtree: true });
  });
}

// What the live region that holds the note held when it was put into the
// page: nothing, when the note arrived in it afterwards.
export function wordsTheRegionArrivedWith(note: Locator): Promise<string | undefined> {
  return note
    .locator('xpath=ancestor::output[1]')
    .evaluate((region) =>
      (window as unknown as WithTheRegionsRecorded).wordsAtArrival(region),
    );
}

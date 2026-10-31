import { describe, expect, it } from '@jest/globals';

import { CannotInspect, type Landing, landOnTheDashboard } from '../chrome.ts';
import type { TastePage } from '../taste.ts';

const dashboard = 'http://localhost:3002';
const keycloak = 'http://localhost:8080';

const onTheDashboard: Landing = { origin: dashboard, loginScreen: false, drawn: true };
const onTheLoginScreen: Landing = { origin: keycloak, loginScreen: true, drawn: false };
const onTheWay: Landing = { origin: dashboard, loginScreen: false, drawn: false };

// A tab as the inspector drives it, whose every open of an address lands
// where `landings` says, one list of the states it passes through for each
// open, the last of which it then stays in.
function aTab(landings: Landing[][]) {
  const opened: string[] = [];
  let now: Landing[] = [];
  const page: TastePage = {
    sessionId: 'tab',
    goto: (url) => {
      opened.push(url);
      now = [...(landings[opened.length - 1] ?? landings.at(-1) ?? [])];
      return Promise.resolve('load');
    },
    eval: () => Promise.resolve(now.length > 1 ? now.shift() : now[0]),
    send: () => Promise.resolve(undefined),
    close: () => Promise.resolve(),
  };
  return { page, opened };
}

const quickly = { waitMs: 50, pollMs: 1 };

describe("an inspected tab's landing", () => {
  it('is left to the inspector once the dashboard is drawn, after Keycloak has sent the tab back', async () => {
    const { page, opened } = aTab([[onTheLoginScreen, onTheWay, onTheDashboard]]);
    landOnTheDashboard(page, dashboard, quickly);

    await expect(page.goto(`${dashboard}/catalog`)).resolves.toBe('load');
    expect(opened).toEqual([`${dashboard}/catalog`]);
  });

  it("opens the screen again when the tab is left on Keycloak's login screen, and goes on once it lands", async () => {
    const { page, opened } = aTab([[onTheLoginScreen], [onTheDashboard]]);
    landOnTheDashboard(page, dashboard, quickly);

    await expect(page.goto(`${dashboard}/vendors`)).resolves.toBe('load');
    expect(opened).toEqual([`${dashboard}/vendors`, `${dashboard}/vendors`]);
  });

  it("stops the inspection, rather than judging Keycloak's login screen, when the tab stays on it", async () => {
    const { page, opened } = aTab([[onTheLoginScreen]]);
    landOnTheDashboard(page, dashboard, quickly);

    await expect(page.goto(`${dashboard}/vendors`)).rejects.toThrow(CannotInspect);
    await expect(page.goto(`${dashboard}/vendors`)).rejects.toThrow(
      /Keycloak's login screen/,
    );
    expect(opened.length).toBe(4);
  });

  it('leaves an address that is not the dashboard as the inspector opens it', async () => {
    const { page, opened } = aTab([[onTheLoginScreen]]);
    landOnTheDashboard(page, dashboard, quickly);

    await expect(page.goto('file:///contact-sheet.html')).resolves.toBe('load');
    expect(opened).toEqual(['file:///contact-sheet.html']);
  });
});

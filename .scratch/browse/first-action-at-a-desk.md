# `first-action` at a desk: Show Parts stays at the swing tag's foot

Browse ticket 14's run of Taste's inspector from a fresh clone, on 7 November 2026, found `first-action`, "No visible button in the first screen", on a Category page with nothing on, at 1024 pixels in both languages and at 1280 in Kurdish. It left open whether the owner keeps the page so at desk widths, as they kept a phone's first screen in ticket 11 (its question 3), or Show Parts is brought into the first screen. This file records what was put to the owner and their answer.

## Comments

### 7 November 2026: put to the owner, and kept

**What was measured.** With the inspector's made-up shop (its stand-in API answering a Shopper app of this branch, in the light scheme), where the top edge of Show Parts stands on a Category page with nothing on, in a first screen 768 pixels tall at 1024 and 800 at 1280:

| Page | 1024 × 768 | 1280 × 800 |
|---|---|---|
| CPU, English | 823, 55 below the first screen | 787, its top edge inside, which the inspector counts as a button there |
| CPU, Kurdish | 853, 85 below, the foot's buttons stacked | 811, 11 below |
| GPU, English, its tag 1,318 pixels tall | 1,411, about two screens down | |

Each first screen holds the search and the chips of the manufacturers, the sockets and the cores, with the price fields' tops at its foot, and the sheet's title, sentence and drawing beside them.

**What was shown.** One page in the built-in browser, with the first screens captured at 1024 and 1280 pixels in English and in Kurdish, and a GPU page at 1024 scrolled down its tag as well. Each alternative was made in the captured page alone, never in the source. The pictures are kept in the owner's `.taste-skill/first-action-at-a-desk/`.

- **A, as it is**, recommended: the warning defended at a desk as on a phone. Every chip applies as soon as it is ticked and the list stands beside the tag, so the first screen holds what the Shopper works with, and Show Parts sends only what is typed, standing under the price range that needs it.
- **B, the foot follows the window**: from 64rem, Show Parts and Clear all on a strip of the tag's paper, perforated along its top, held at the window's foot (`position: sticky`) while the tag runs past it, and settled at the tag's foot when the Shopper reaches it, as the price slip holds its place beside a Part's Offers. It would cover the tag's last 89 pixels while it follows, and 149 in Kurdish at 1024, where the buttons stack and the Cores filter then starts under it on the first screen; and it would need the page's scroll padding to keep a focused chip from being hidden under it (WCAG 2.4.11).
- **C, Show Parts under the search**: from 64rem, half the tag wide at its start, with Clear all alone at the foot. The price range would lose the button beside it; set beside the search instead, the button cut the search's hint at 1024 and 1280 pixels; and the owner had declined a button by the search on a phone.

B and C each ended the warning at every desk width in both languages, by the inspector's own reading of a button measured on the captures.

**The owner's answer**, in chat: "A, as it is". Nothing changes on the page.

- `apps/shopper/DESIGN.md`'s swing tag says that Show Parts stays at the foot at every width, why, and that `first-action` is defended at a desk as on a phone.
- The MVP spec's reference for the Shopper's WARNs lists `first-action` on the Category page with nothing on at 1024 in both languages and at 1280 in Kurdish, beside 390 in Kurdish.
- Ticket 14's follow-up points here.

**Checks.** On `browse/integration` at `a30fec7`, this branch's base. This record is gated on `pnpm check --skip-nx-cache`, every `*.tsbuildinfo` of the worktree deleted first. `pnpm platform:check` ran from this branch's worktree under the browse run's e2e lock, with nothing listening on ports 3000 to 3002 before it or after: 387 passed in 16.7 minutes, none failed, flaky or skipped, and the apps logged no hydration error. No page changed, so `pnpm shopper:inspect` was not run again, and ticket 14's run stands for the warning.

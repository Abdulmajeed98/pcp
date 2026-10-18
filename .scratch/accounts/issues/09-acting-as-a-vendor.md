# 09: Acting as a Vendor

**Spec:** [the accounts spec](../spec.md)

**What to build:** From a Vendor's page in the Admin console, the Admin opens that Vendor's portal and does there everything the Vendor can do, with the Admin's own Login (ACC-6). Every screen shows a band that names the Vendor, as written, and links back to its page. The portal is in its own language, by the portal's own rule, with its switch. Leaving it returns the Admin console to English, left to right, with its own title.

**Blocked by:** 08

**Status:** resolved

- [x] **Which half.** `halfFor`'s comment says that the Admin console can now also show a Vendor's portal, at an address under the Vendor's page. No other rule is made.
- [x] The Admin console's router mounts the Vendor portal's pages under that address, in the Vendor portal's frame, with the band. Each page learns its Vendor from the address, as ticket 07 found.
- [x] Every request made there carries the Admin's own token. Keycloak's impersonation is not used.
- [x] **The band** is on every screen of the portal while the Admin acts as a Vendor. It names the Vendor, `AsWritten`, and links back to the Vendor's page. Its text is in `i18n`'s dashboard set, in the three languages, drafted and marked for review. If ticket 12 is done, it also says when the Vendor is deactivated; otherwise ticket 12 adds that.
- [x] **Language.** Entering the portal sets the document's language, direction and title by the Vendor portal's rule: the language chosen with its switch in this browser, else the browser's, else Kurdish. The switch works there and is remembered in this browser. Leaving the portal sets the document back to English, left to right, with the Admin console's title.
- [x] A Vendor's page in the Admin console gains a link that opens its portal.
- [x] It follows DESIGN.md, is laid out at 360 pixels wide first, uses logical classes only, and keeps to Feature-Sliced Design's import rules.
- [x] `pnpm platform:check` gains these lines, and passes on every line. Each runs as the development Admin, in a window 360 pixels wide:
  - From a made-up Vendor's page, the Admin opens its portal. The band names the Vendor on the details screen and on its form, and the document declares the portal's language.
  - The Admin changes the Vendor's opening hours there. The Vendor, logged in in another browser, sees the change.
  - The portal's switch changes the language there.
  - The band's link returns to the Vendor's page, which declares English, left to right, with the Admin console's title.
  - `expectAccessible` passes on the portal with its band, in the light and in the dark scheme.
- [x] Shown once and then reverted, each failing on its own line: the band taken off; the document left in the portal's language after leaving; the portal's pages asking for the Caller's Vendor instead of the Vendor in the address.
- [x] `pnpm check` passes with Docker stopped.
- [x] The results of the fault checks are recorded under Comments.
- [x] The work is committed in pieces, each leaving `pnpm check` passing.

## Comments

### 18 October 2026: completed

**What was built.**

- **Which half.** `halfFor`'s comment says that the Admin console can also show a Vendor's portal, at an address under the Vendor's page, for the Admin acting as that Vendor with the Admin's own Login, and that this is a screen of the Admin console and no rule of its own. The rule did not change. The comment on `halves` says what the Admin console is shown in while it acts, and after.
- **The frame, split.** As ticket 07 asked, `PortalFrame` draws the Vendor portal's frame, its top bar and the screen, around a Vendor it is given as the API answered it, `VendorAskedFor`. `VendorPortalFrame` gives it the Caller's Vendor and keeps the message for a Login with no Vendor behind it. `ActingAsVendorFrame` gives it the Vendor named in the address, read with `useVendor`, so through the API's rule, which lets the Admin name any Vendor. Every request carries the Admin's own token, and Keycloak's impersonation is not used.
- **The router.** The Admin console's router mounts `vendorPortalScreens`, the Vendor portal's own array, at `/vendors/:vendorId/portal`, a route of its own beside the Admin console's frame and not inside it, so the Vendors list is not drawn beside it on a wide screen. React Router ranks it above the console's `*`. The screens' links, `contact-details` and `..`, are relative to the route, as ticket 07 found, and lead to the same screens there.
- **The band**, above the frame's top bar, across the whole width on a Shelf ground closed by a Rule Sand rule: "You are acting as …", with the Vendor's name `AsWritten` once it is read, and a link, "Back to the Admin console", to the Vendor's page. Its text is `ActingAsVendor` in `i18n`'s dashboard set, in the three languages, drafted for review: تۆ لە جیاتی … کار دەکەیت and أنت تعمل نيابةً عن …, which say "on behalf of", as the spec defines acting. The word list gains "Admin console", کۆنسۆڵی بەڕێوەبەر and لوحة تحكم المسؤول, for the link. Ticket 12 is not done, so the band says nothing of a deactivated Vendor; ticket 12 adds that.
- **Language.** `showIn`, beside `startLanguage` and `chooseLanguage` in the dashboard's `shared/i18n`, shows the dashboard in place in what a half is shown in: the language, which it does not remember, the direction and the tab's title. The acting frame calls it with the Vendor portal's rule when it is first drawn, in a layout effect, and with the Admin console's when it goes, by the band's link or any other way, such as the browser's back button. The switch is the portal's own, and remembers its choice in this browser. i18next keeps the last language asked for, and with every language's text given to it at the start each call ends in the order made, so React's development mode, which enters, leaves and enters again, leaves the document in the portal's language. react-i18next 17 re-renders through `useSyncExternalStore`, and a change made in a layout effect is drawn before the browser paints.
- **A Vendor's page** in the Admin console gains an outlined link, "Open its portal", below the Vendor's name.
- **DESIGN.md** records the band and the link. The MVP spec records the address, that the Admin console reads and writes the remembered choice there and returns to English after, the frames that learn the Vendor each in its own way, and the band among the screens that call `expectAccessible`.

**The tests.** A made-up Vendor's login details now carry its identifier, `vendorId`, beside its name. The new lines of `pnpm platform:check` are in `admin-acting-as-vendor.spec.ts`, as the development Admin in a window 360 pixels wide, with the browser set to Arabic as written in Iraq, so that the portal opens in Arabic and the Admin console is told apart from it, and one in `dashboard-languages.spec.ts`. No line quotes the portal's text; the band is found by its test id.

| Ticket's line | Test |
|---|---|
| From a made-up Vendor's page the Admin opens its portal; the band names the Vendor on the details screen and on its form, and the document declares the portal's language | The first line: Arabic, right to left and not the Admin console's title; the band's name as written, and its link to the Vendor's page, on both screens. Not asked for: every request to the API carries the token the Admin console asked who the caller is with, none asks for the Caller's Vendor, and each the portal makes names the Vendor in its address |
| The Admin changes the opening hours there, and the Vendor, logged in in another browser, sees them | The second: the Vendor logs in first in a browser of its own, and after the Admin's save reloads and reads them |
| The portal's switch changes the language there | The third: Kurdish, then English, with the band and the address kept; English is still chosen after a reload in the Arabic browser |
| The band's link returns to the Vendor's page, in English, left to right, with the Admin console's title | The fourth |
| `expectAccessible` on the portal with its band, in light and in dark | The fifth, with no sideways scroll |
| Not asked for: the acting portal passes `checkInEveryLanguageOfTheVendorPortal`, and the band's text differs in each language | `dashboard-languages.spec.ts` |

The five lines of the first file were run before the code existed and failed, each waiting for the link "Open its portal". The language line was written with them but first run after the code, and passed; the first fault below shows it can fail.

**Fault checks**, each planted after the work was committed, by a script that refused a tree differing from `HEAD` but for `.claude/`, made exact edits, ran both files, wrote the file back and printed `git status`, which showed only `.claude/` after each:

| Fault | Failed |
|---|---|
| The band taken off the acting portal | Every line that looks at the band: the first, third, fourth and fifth, each finding no Vendor's name in it, and the language line. The line of the opening hours, which does not look at the band, passed. 26 passed. |
| The document left in the portal's language after leaving, the frame's layout effect leaving nothing on its way out | The band's link line alone, the document declaring `ar` where `en` was expected. 30 passed. |
| The portal's pages asking for the Caller's Vendor, the acting frame reading `useCallersVendor` instead of the Vendor in the address | All five acting lines and the language line: the API answers the Admin's call for the Caller's Vendor 403, and the frame never names the Vendor. 25 passed. |

**Results.** `pnpm platform:check` passes 120 tests against the owner's services with no reset, and `pnpm check` and `pnpm boundaries:check` pass. The API did not change, so `pnpm integration:check` was not run. Each of the three commits passed `pnpm check --skip-nx-cache` in a fresh clone in the scratchpad, installed offline, with `DOCKER_HOST` pointed at a socket that does not exist and no browser installed.

### 18 October 2026: the code review

Two reviewers read the change, one against the repository's standards and one against this ticket and the spec. Neither found a requirement missing or a standard broken. Corrected:

- The router's comment said that each screen learns its Vendor from the address; the frame does, and gives it to each screen.
- `showIn`'s comment said that a later call wins, without saying why; it now names what that rests on.
- A comment of the portal's screens was left unwrapped.
- The first line checked the portal's addresses with a pattern that took the API's address unescaped; it compares their text.

Kept as they are: the portal's address is written out in three places, the route, the page's link and the band's, as every other address of the dashboard is. `showIn` and `startLanguage` both end by setting the title and declaring the language, two lines each. `VendorAskedFor` names what the frame needs of TanStack Query's answer and no more. A Vendor that cannot be read, such as one at an address that names none, gets the frame's own refusal, "Your portal could not be opened.", under the band with its link and no name; only a hand-typed address meets it.

**Left open, as the spec lists them.** By hand in the owner's browser: the band matching DESIGN.md. On a phone, once the platform is hosted, now listed in the MVP spec's "Checks on a phone wait for hosting": acting as a Vendor in its shop, the band and its link used with a thumb, in Kurdish and in English.

### 18 October 2026: decisions left open, for the owner

Each was taken the way the ticket or DESIGN.md pointed, and none blocks the module.

- **The band's look**: across the whole width above the portal's top bar, on a Shelf ground closed by a Rule Sand rule, the sentence at small size and weight 500 and the link underlined. It is quiet, as DESIGN.md keeps colour for plates, action and state, and still unlike anything of the Vendor's own portal. **My recommendation:** keep it.
- **The band's words**: "You are acting as …" and "Back to the Admin console", with Kurdish and Arabic that say "on behalf of". **My recommendation:** keep them, and read the Kurdish and the Arabic with the rest of LANG-7's review.
- **Log out stays in the portal's top bar** while the Admin acts, and logs the Admin out, as the frame is the portal's own. **My recommendation:** keep it; the band's link is the way back, and the Login is the Admin's own.
- **The link on a Vendor's page**: "Open its portal", outlined, below the Vendor's name. **My recommendation:** keep it.

### 18 October 2026: the owner's decisions

The four decisions were put to the owner on 18 October 2026, one at a time, each rendered in the built-in browser. The screens were captured from the real app, at 360 pixels wide, by a throwaway end-to-end test, deleted after. Each alternative was made by changing the page in that test, not the source, and laid beside the screen as built, in Kurdish and English.

- **The band's look.** **A Shelf ground**, as built and as recommended. The owner saw it beside an Ink ground with Warm Page text, drawn as the primary button is.
- **The band's words.** **"You are acting as …" and "Back to the Admin console"**, as built and as recommended. The owner saw them beside "The Admin is acting for …" and "Leave the portal", in Kurdish and English.
- **Log out while acting.** **Kept**, as built and as recommended. The owner saw the top bar with Log out hidden beside it.
- **The link on a Vendor's page.** **"Open its portal"**, as built and as recommended. The owner saw it beside "Act as this Vendor".

Nothing changed in the code, so no check was run again.

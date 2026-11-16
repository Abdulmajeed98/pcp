# 05: Send on WhatsApp

**Spec:** [the sharing spec](../spec.md)

**What to build:** In the second price view, on the Build page and on the Shared Build page, each Vendor that gave a WhatsApp number has a "send on WhatsApp" button (SHR-5).

- **One tap** shares the Build if it has not been shared yet and records a Referral (SHR-6).
- **It opens a WhatsApp chat** with that Vendor in a new tab. The message is in the page's language and holds the Shared Build's link.
- **The count rises.** That Vendor's Referral count rises by one, and the Admin and that Vendor see it, nobody else.
- **The platform sends nothing itself.**

This makes success criterion 8 true.

**Blocked by:** 03, 04

**Status:** ready-for-agent

- [ ] **The buttons**, built to DESIGN.md, on each Vendor's line of both pages' second price view. A Vendor that gave no WhatsApp number has no button, and its Vendor page stays linked.
- [ ] **The forms.** Each button is a plain form sent with POST, with `vendor`, and opens in a new tab (`target="_blank"`), as the Vendor page's WhatsApp cell does.
  - From the Build page it is sent to `/{language}/build/send`, which shares the cookie's Build through `POST v1/shared-builds` first.
  - From the Shared Build page it is sent to `/{language}/builds/{sharedBuildId}/send`.
  - Each then records the Referral through `POST v1/shared-builds/{id}/referrals`, and is answered by `answerAForm` with 303 and the chat's address. `whatsAppChatWith` from `@pcp/links` writes that address with the number the Referral answered.
- [ ] **The message** is one sentence in the page's language, naming the Vendor as it wrote its name, then the link. The link is `SHOPPER_PUBLIC_URL` followed by the Shared Build page's address in that language. It names no price and no city.
- [ ] **Refusals.** A Vendor deactivated, or without a WhatsApp number, since the page was drawn, an empty or refused Build, and an API that does not answer each come back to the page the form was sent from, with the reason in the address. The page says the reason, and no chat is opened.
- [ ] **With script**, the button cannot be pressed again while its first tap is being handled. Without script, each tap is a Referral, as SHR-6 says.
- [ ] **Words.** The message and the refusals are in the `i18n` library's Shopper set in all three languages, the Kurdish and Arabic drafts for LANG-7. Removing the Arabic text of the message is seen to fail `pnpm check` once, then reverted.
- [ ] **Seam 4**, the Shopper's unit tests:
  - the message in each language holds the link and the Vendor's name as written, and no price;
  - each refusal is read back from the address.
- [ ] **Seam 3**, in a window 360 pixels wide, in Kurdish, Arabic and English. The chat is never opened: the test reads the address the new tab is sent to, and answers it with `page.route` so that nothing leaves the machine.
  - **From the Build page.** Tapping a Vendor's button opens a new tab to WhatsApp's chat with that Vendor's number. Its message holds the Shared Build's link in the page's language.
  - **The count rises.** That Vendor's count rises by one on the Admin console's Referrals screen and in its own portal. Another made-up Vendor's portal shows its count unchanged (success criterion 8).
  - **From the Shared Build page**, the same holds.
  - **No WhatsApp number.** A Vendor that gave none has no button.
  - **Without script.** Sending works with script switched off.
  - **Accessibility and motion.** `expectAccessible` passes on both pages with their buttons, in both schemes. The motion DESIGN.md adds is filmed with `film` and judged by `snapsOf`.
- [ ] **`pnpm shopper:inspect`** runs on the Build page and on the Shared Build page with their buttons. It runs in both schemes, in Kurdish and English, at 1440, 768 and 390 pixels, and at 1024 and 1280 for desk layouts. Every FAIL is fixed, and every WARN is fixed or defended under Comments.
- [ ] **Phone checks** are recorded under Comments as open, waiting for hosting:
  - "send on WhatsApp" opening the WhatsApp app in a chat with the Vendor, with the message written in each language;
  - the button used with a thumb;
  - its motion felt on a real phone, with reduced motion on and off.
- [ ] `pnpm check` and `pnpm platform:check` pass, and the work is committed.

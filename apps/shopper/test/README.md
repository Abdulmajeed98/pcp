# The Shopper app's unit tests

This folder holds the Shopper app's unit tests, the fourth test seam of the `browse` module, which the owner added on 3 November 2026. They run with Vitest, the runner the owner chose the same day, through the project's `test` target, so `pnpm check` runs them. Run them alone with `pnpm exec nx test @pcp/shopper`.

## What they test

Plain functions of the Shopper app only, each called with its inputs and judged by its output: an address written back, a query read, a price or a number of days worded in a language.

Since `builder` they also hold the Build's cookie, its changes and its limits, the Build as the API's query, the Build page's status and the words of every rule's every outcome, and the picker's query and what it shows. Since `sharing` they hold:

- a Shared Build's address and its link on the public address, in each language (`entities/shared-build`);
- whether the browser's Build is the Shared Build, and the Build a copy writes from its values, leaving out the Parts the catalog no longer answers (`entities/build`);
- each sharing form's answer and its refusal read back from the address, the share's, the copy's and the send's (`features/share-a-build`, `features/copy-a-shared-build`, `features/send-on-whatsapp`);
- the WhatsApp message in each language, with the Vendor's name kept apart as written and no price, and the chat's address (`features/send-on-whatsapp`);
- the Shared Build page's preview and the words of when a Build was shared, in each language (`_pages/shared-build`);
- why a Referral was refused, and a 400 that is not the API's read as no answer (`shared/api`).

A test imports a function through its module's public face: the index file of its slice, of its segment of the Shared layer, or of the App layer, through the `@/` alias, as the rest of the app imports it. Never a helper behind an index file, which is free to change. Lint refuses an import past an index file, and a relative path into `src`.

They never test a server component, a page, the API or what the browser draws. The API is tested from the outside by `pnpm integration:check`, and the pages, the frame and everything the browser draws by `pnpm platform:check`.

## Where they live

Here, beside `src` and outside its layers, mirroring `src`: the tests of `src/shared/currency` are in `shared/currency/`. Each file is named `<what it tests>.spec.ts`.

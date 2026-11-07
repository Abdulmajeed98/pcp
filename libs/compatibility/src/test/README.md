# The compatibility library's tests

This folder holds the tests of `@pcp/compatibility`, the test seam the owner added on 7 November 2026 for the `compatibility` module: the library's public face. They run with Jest, as `core`'s and the API's tests do, through the project's `test` target, so `pnpm check` runs them. Run them alone with `pnpm exec nx test @pcp/compatibility`.

## What they test

The Compatibility Rules from the outside, as `builder` will use them. A test hands the library a Build of made-up Parts, whose needed specifications are written in OpenDB's names and nesting as the catalog holds them, with each missing one left out, and judges only what the library answers: each rule's outcome, the Parts it names by the identifiers the test gave, and, for an unchecked rule, the missing specifications it names.

For every rule, a test for each outcome it can have, and tests of each reading of OpenDB's values the spec decides, of the counts at their limit and one over, of a kit's or a drive's quantity, of a rule that does not apply, and of a rule left unchecked only when a missing value could change its outcome.

A test imports only the library's entry file, `src/index.ts`, as every caller does.

## What they never test

A rule's own helper, or how a rule is put together: no test imports a file behind the entry file, so a rule can be stated anew without changing a test. Nor the catalog's rule for what is missing, which the API keeps; the values the Admin's forms offer, which the Categories endpoint's test proves through the API; or anything a screen draws.

## How they are written

With Jest's globals, `describe`, `it` and `expect`, and nothing imported from Jest or from any other package: the library's ban on npm packages covers its test files. They are held to the test files' eight lint rules, among them `it` and not `test`, a `describe` around every test, and an assertion in every test. A helper that asserts counts as one only when those rules name it in their list of assertions. `outcomeOf` asserts nothing: it picks one rule's outcome from a Build's, for the rules that share their Parts with others.

## Where they live

Here, under `src`, with the library's type check: `judge-build.spec.ts` for judging a Build as a whole, and `rules/` for each rule, one file each. Each file is named `<what it tests>.spec.ts`.

# Each app has a look and a set of components of its own

The Shopper app and the dashboard look different, and each has its own shadcn/ui components. The Shopper app's look is Fit Diagram, built on shadcn/ui's Lyra style, and the dashboard's is Rate Board, built on its Mira style. The Admin console and the Vendor portal share the dashboard's. The owner chose this on 15 October 2026, after a second search asked whether the two could each be "tailored to them". The research is in [docs/research/design-system.md](../research/design-system.md).

The two share what does not belong to either look. The `ui` library keeps the foundations, from the accessibility standard and the languages: the sizes, the smallest control, the larger Kurdish and Arabic text, the two schemes, and the components that carry no look, such as `AlwaysEnglish` and `AsWritten`. It also keeps each look's tokens, in a theme for each app, which the app's stylesheet imports. The DESIGN.md at the repository root holds the foundations, and each app's folder has a DESIGN.md of its own, which Impeccable reads for that app.

Both sets of components are built on Base UI, shadcn/ui's default library.

## Considered Options

- **One look, with the dashboard's screens denser.** The research's recommendation, and the first choice. One set of components and one set of tokens.
- **Two themes over one set of components**, as Adobe's Spectrum and IBM's Carbon do. Each app sets its own palette, type, radius and density, and a fix to a component reaches both. A button could not differ in shape or spacing, only in its tokens.
- **Two sets of components**, as Shopify keeps its admin's Polaris apart from its storefronts' themes. Chosen. A component's shape and spacing can differ too.

## Consequences

- Every component that both apps need is added twice, once for each style, and a fix to one is made to the other by hand.
- shadcn/ui fixes a set's style when the set is created, and its documentation describes one set of components in a monorepo. Where each set lives, and how its command writes into it, is settled when the first component is added, in the `catalog` module's ticket 11.
- The Vendor portal is in Kurdish, Arabic and English, so the dashboard's look must work right to left, although the Admin console is in English only.
- A page is checked against its own app's DESIGN.md and against the root one.

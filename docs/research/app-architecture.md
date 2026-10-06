# Which architecture should each app follow?

Researched on 6 October 2026 for the stack discussion. The monorepo will hold a NestJS API, a Next.js Shopper app and a React single-page dashboard, managed with Nx and pnpm. The owner wants each app to follow a comprehensive, named architecture and is considering hexagonal or clean architecture for the API.

Every claim below cites the source that owns it. Paragraphs headed "Reading" are this document's own analysis, not something a source says.

## Summary

| App | Recommended architecture | Enforced by |
|---|---|---|
| API (NestJS) | Hexagonal, organised by module first, with `domain`, `application` and `infrastructure` layers inside each module | Folder-level lint inside the app |
| Shopper app (Next.js) | Feature-Sliced Design | Steiger |
| Dashboard (React SPA) | Feature-Sliced Design | Steiger |
| Between apps and shared packages | Nx tags | `@nx/enforce-module-boundaries` |

These are recommendations. The owner's decisions are recorded in the spec and in ADRs, not here.

## Backend candidates

### Hexagonal architecture (ports and adapters)

The pattern's stated intent is to "allow an application to equally be driven by users, programs, automated test or batch scripts, and to be developed and tested in isolation from its eventual run-time devices and databases." [1]

- A port is "a purposeful conversation" between the application and something outside it. An adapter is technology-specific code that "converts the API definition to the signals needed by that device and vice versa." [1]
- A primary actor "drives the application"; a secondary actor is "one that the application drives, either to get answers from or to merely notify." [1]
- The pattern does not prescribe how the inside of the application is structured. Its rule is about the boundary: "code pertaining to the inside part should not leak into the outside part." [1]
- It expects few ports: "two, three or four ports" is typical, and "it doesn't appear that there is any particular damage in choosing the wrong number of ports." [1]

### Clean architecture

Its one rule is the Dependency Rule: "source code dependencies can only point inwards. Nothing in an inner circle can know anything at all about something in an outer circle." [2]

- It names four circles, from the inside out: Entities, Use Cases, Interface Adapters, and Frameworks and Drivers. [2]
- The number is not fixed: "the circles are schematic. You may find that you need more than just these four." [2]
- It presents hexagonal architecture as one of several architectures with the same objective, "the separation of concerns", each achieving it "by dividing the software into layers." [2]
- Data crossing a boundary is "isolated, simple, data structures"; "we don't want to cheat and pass Entities or Database rows." [2]

### Vertical slice architecture

This is a reaction to layered architectures, which its author calls appropriate "in a minority of the typical requests" and prone to "mock-heavy" tests and "rigid rules around dependency management." [3]

- The architecture is "built around distinct requests, encapsulating and grouping all concerns from front-end to back." [3]
- Its rule: "minimize coupling between slices, and maximize coupling in a slice." [3]
- Domain modelling is introduced only where needed: "start simple (Transaction Script) and simply refactor to the patterns that emerges from code smells we see." [3]

### What NestJS itself provides

- A module "encapsulates its providers by default: you can inject only providers that are part of the current module or that are explicitly exported by an imported module." [4]
- NestJS recommends feature modules: "a feature module organizes the code for a specific feature, which keeps boundaries clear." [4]
- A class can depend on an abstraction. An abstract class survives compilation and can be used directly as an injection token, bound to an implementation with `{ provide: LoggerService, useClass: PinoLoggerService }`. Interfaces are erased at compile time and need a string or symbol token with `@Inject()`. [5]

### A NestJS reference implementation

The `domain-driven-hexagon` repository is the most cited worked example of hexagonal architecture in NestJS. [6]

- It organises by module first, with layers inside each module: "Each module's name should reflect an important concept from the Domain and have its own folder with a dedicated codebase." [6]
- Inside the core, "dependencies point inwards. Outer layers can depend on inner layers, but inner layers never depend on outer layers." [6]
- A repository's port lives with the application or domain code and its implementation lives in the infrastructure or database folder. [6]
- It uses dependency-cruiser to validate the direction of dependencies. [6]
- It warns repeatedly against applying all of it everywhere:
  - "Some practices presented here are not recommended for small-medium sized applications with not a lot of business logic." [6]
  - "abusing ports/interfaces may lead to unnecessary abstractions and overcomplicate your application. In a lot of cases it's totally fine to depend on a concrete implementation instead of abstracting it." [6]
  - "separating domain and persistence models may be overkill for smaller applications." [6]

### Reading: how the backend candidates relate

Hexagonal and clean architecture are not alternatives so much as two levels of detail. Hexagonal defines the boundary between the application and the outside world and says nothing about the inside. Clean architecture adds the inward dependency rule and names the inner layers. Vertical slicing answers a different question, which is whether to group code by module or by layer. The reference implementation combines all three: modules first, layers inside each module, ports at the edge.

For this project the external systems behind ports are real ones: PostgreSQL, Keycloak, Excel files, photo storage and the clock (for Offer expiry). The modules with substantial rules are `offers`, `pricing`, `compatibility`, `builder` and `sheet`. Modules such as Vendor profile editing have little logic, and for those the layers will be thin.

## Frontend candidates

### Feature-Sliced Design

Feature-Sliced Design (FSD) is "an architectural methodology for scaffolding front-end applications." [7]

- It suits front-end applications, not libraries, and is framework agnostic, with "no restrictions on what programming language, UI framework, or state manager you use." [7]
- Its layers, from top to bottom, are App, Pages, Widgets, Features, Entities and Shared. A seventh layer, Processes, is deprecated. [8]
- Its import rule: "A module (file) in a slice can only import other slices when they are located on layers strictly below." [8]
- Layers are optional. Most projects have at least Shared, Pages and App. [8]
- Inside a slice, code is grouped into segments such as `ui`, `api`, `model`, `lib` and `config`. [8]
- With the Next.js App Router, Next's own `app` folder is kept for routing only. The FSD layers live in `src`, with the App and Pages layers renamed `_app` and `_pages` to avoid the name clash, and each route file re-exports a page: `export { ExamplePage as default, metadata } from '@/_pages/example';` [9]
- Steiger is FSD's linter. It checks forbidden imports between layers and slices and that slices are used only through their public API. It "is in beta and in active development. Some APIs may change." [10]

### Feature folders (bulletproof-react)

A lighter convention with three levels: shared code, features, and the app. [11]

- "The code should flow in one direction, from shared parts of the code to the application (shared -> features -> app)." [11]
- "It might not be a good idea to import across the features. Instead, compose different features at the application level." [11]
- It is enforced with the ESLint rule `import/no-restricted-paths`. [11]
- It advises against barrel files with Vite, because they "can cause issues for Vite to do tree shaking and can lead to performance issues." [11]

### Nx library types

Nx suggests four library types: feature (container components for a business use case), UI (presentational components only), data-access (back-end communication and state management) and utility (low-level helpers). They are expressed as project tags such as `type:feature`. [12]

### Next.js

"Next.js is **unopinionated** about how you organize and colocate your project files." It supports keeping project files outside `app`, inside `app`, or split by feature or route, and advises to "choose a strategy that works for you and your team and be consistent across the project." [13]

### Reading: how the frontend candidates relate

FSD and feature folders share one idea, a one-way flow of imports from shared code up to the app. FSD is the more complete of the two: it adds the Entities and Widgets layers and a public-API rule, has its own documentation and linter, and has an official guide for Next.js. Feature folders are simpler and enforced with plain ESLint.

Hexagonal architecture adds little on these frontends. The business rules live in the API and in the shared `compatibility` package, so a frontend has few rules of its own to isolate.

Using FSD in both frontends means one set of conventions, and slices for the same concept (Part, Offer, Vendor, Build) look alike in both apps.

## Enforcement with Nx

- The rule is `@nx/enforce-module-boundaries`, available for ESLint and Oxlint. Projects carry tags, and `depConstraints` state which tags a tagged project may depend on. [14]
- Tags can have more than one dimension, for example `scope:` and `type:`, each with its own constraints, and `allSourceTags` targets projects carrying several tags at once. [15]
- Nx Conformance, the language-agnostic alternative, "requires the Nx Enterprise plan." [14]

Reading: tags belong to projects, so this rule constrains imports between projects and not between folders inside one project. Enforcing layers inside an app therefore needs either a folder-level tool (Steiger for FSD, dependency-cruiser or an ESLint path rule for the API's layers) or splitting every layer into its own Nx project. For 11 API modules with three layers each, the second option means about 33 projects.

## Version constraints found

Checked against the npm registry and GitHub on 6 October 2026.

- `@nx/nest` 23.2.1 declares `@nestjs/core` `>=10.0.0 <12.0.0`, so it does not support NestJS 12, which was released on 27 August 2026 (latest 12.1.2). The Nx issues are open [16][17] and a fix is in an open pull request [18]. NestJS 11 is still published (11.2.7 on 30 September 2026). [19]
- `nestjs-zod` 5.5.0, the library that lets NestJS validate with Zod schemas, declares `@nestjs/common` `^10.0.0 || ^11.0.0`, so it does not support NestJS 12 yet either. [19]
- `@nx/next` 23.2.1 supports Next.js 14 to 16. `@nx/vite` supports Vite 5 to 8. `@nx/eslint` supports ESLint 9 and 10. [19]
- Weekly npm downloads: `nx` about 12.4 million, `turbo` about 34.2 million. [19]

## Sources

1. Alistair Cockburn, [Hexagonal architecture](https://alistair.cockburn.us/hexagonal-architecture/)
2. Robert C. Martin, [The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
3. Jimmy Bogard, [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/)
4. NestJS documentation, [Modules](https://docs.nestjs.com/modules)
5. NestJS documentation, [Custom providers](https://docs.nestjs.com/fundamentals/custom-providers)
6. Sairyss, [domain-driven-hexagon](https://github.com/Sairyss/domain-driven-hexagon) (a community reference implementation, not an official NestJS source)
7. Feature-Sliced Design, [Overview](https://feature-sliced.design/docs/get-started/overview)
8. Feature-Sliced Design, [Layers](https://feature-sliced.design/docs/reference/layers)
9. Feature-Sliced Design, [Usage with Next.js](https://feature-sliced.design/docs/guides/tech/with-nextjs)
10. [Steiger](https://github.com/feature-sliced/steiger)
11. alan2207, [bulletproof-react: project structure](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)
12. Nx documentation, [Project dependency rules](https://nx.dev/docs/concepts/decisions/project-dependency-rules) (the page could not be fetched directly; its content is as returned by a search of nx.dev)
13. Next.js documentation, [Project structure and organization](https://nextjs.org/docs/app/getting-started/project-structure) (version 16.3.8)
14. Nx documentation, [Enforce module boundaries](https://nx.dev/features/enforce-module-boundaries)
15. Nx documentation, [Tag in multiple dimensions](https://nx.dev/docs/guides/enforce-module-boundaries/tag-multiple-dimensions)
16. [nrwl/nx issue 36936](https://github.com/nrwl/nx/issues/36936): `@nx/nest` cannot be installed with NestJS 12
17. [nrwl/nx issue 36913](https://github.com/nrwl/nx/issues/36913): the `@nx/nest` application generator cannot follow NestJS 12
18. [nrwl/nx pull request 36937](https://github.com/nrwl/nx/pull/36937): support NestJS 12
19. npm registry metadata and download counts for `@nx/nest`, `@nx/next`, `@nx/vite`, `@nx/eslint`, `@nestjs/core`, `nestjs-zod`, `nx` and `turbo`
